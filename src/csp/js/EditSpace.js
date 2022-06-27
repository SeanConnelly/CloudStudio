import {App} from './App.js';
import {TabLayout} from "./TabLayout.js";
import {Document} from "./iris/Document.js";
import {AppDirector} from "./AppDirector.js";
import {Editor} from "./Editor.js";
import {PromptBox} from "./Prompt.js"
import {CodeTemplates} from "./iris/CodeTemplates.js";

//tiny dom helper
const $div = (...cl) => { let div = document.createElement('div'); if (cl) div.classList.add(...cl); return div}

export class EditSpace {

    constructor() {
        this.el = $div('fit');              //root element of the edit space
        this.tabLayoutInFocus = undefined;      //track the most recent tab layout in focus
        this.tabLayouts = {};                   //maintain a handle on all tab layouts in edit space using tab uid's
    }

    mount(el) {
        this.parentEl = el;
        this.parentEl.innerHTML = '';
        this.parentEl.append(this.el);

        let colRowRef = this.appendNewColumnAndRow()
        this.addTabLayoutToColumnRow(colRowRef)

    }

    //=========================================================================
    // DOCUMENT ACTIONS
    //=========================================================================
    openDocumentForEdit(docName) {
        if (this.isDocumentOpen(docName)) {
            this.giveDocumentFocus(docName);
        } else {
            let ns = AppDirector.get('Model.NameSpace');
            Document.open(ns,docName).then(doc => {
                let editor = new Editor(doc);
                let tabLayoutInFocus = this.getTabLayoutInFocus();
                this.addDocumentEditorToTabLayout(tabLayoutInFocus,docName,editor)
            })
        }
    }

    saveDocumentInFocus() {
        let editor = this.getTabLayoutInFocus().getTabItemInFocus();
        editor.save();
    }

    saveAllDocuments() {
        this.eachEditor( editor => {
            editor.save();
        })
    }

    compileDocumentInFocus() {
        let editor = this.getTabLayoutInFocus().getTabItemInFocus();
        editor.compile();
    }

    compileAllOpenDocuments() {
        this.eachEditor( editor => {
            editor.compile();
        })
    }

    newDocument(docType) {
        let text=newItemPromptText[docType].Text;
        let extension=newItemPromptText[docType].Type
        this.promptBox = new PromptBox(`Enter New ${text} Name`,extension,docType)
    }

    makeNewDocument(docNameType) {
        let fullDocName = docNameType.name + '.' + docNameType.type.toLowerCase();
        let src = CodeTemplates.GetTemplate(docNameType.docType,docNameType.name);
        let doc = new Document(AppDirector.get('Model.NameSpace'),fullDocName,src);
        let editor = new Editor(doc);
        this.addDocumentEditorToTabLayout(this.getTabLayoutInFocus(),fullDocName,editor);
        editor.editor.focus();
    }

    closeDocument(docName) {
        this.eachEditor( (editor,tabLayout) => {
            if (docName === editor.doc.name) {
                if (editor.hasChanged) {
                    //TODO, check document is different and prompt user to save first
                    console.log('document has changed, prompt user before removing');
                } else {
                    tabLayout.deleteTab(docName);
                    AppDirector.removeItem('Model.DocumentsOpenForEdit',docName);
                    this.removeEmptyTabLayouts();
                }
            }
        })
    }

    isDocumentOpen(docName) {
        let isOpen=false;
        this.eachEditor( editor => {
            if (docName === editor.doc.name) isOpen=true;
        })
        return isOpen;
    }

    giveDocumentFocus(docName) {
        this.eachEditor( (editor,tabLayout) => {
            if (docName === editor.doc.name) {
                tabLayout.setTabItemInFocusByName(docName)
                tabLayout.moveTabToStart(docName)
            }
        })
    }

    //=========================================================================
    // TAB LAYOUTS
    //=========================================================================
    addTabLayoutToColumnRow(colRowRef) {
        let tabLayout = new TabLayout({
            position: 'top',
            overflow: true,
            group: 'editors',
            uid : App.getAppItemUid(),
            parentInfo : {'colRowRef':colRowRef}  //TODO: review this
        })
        this.tabLayouts[tabLayout.uid] = tabLayout
        tabLayout.mount(colRowRef.rowEl);
        this.tabLayoutInFocus = {'uid': tabLayout.uid, 'colRowRef': colRowRef};
        return tabLayout;
    }

    addDocumentEditorToTabLayout(tabLayout,docName,documentEditor) {
        tabLayout.addNewTabToLayout(docName,documentEditor,this.getTabContextMenuFragmentForDocument(docName));
    }

    getTabContextMenuFragmentForDocument(docName) {
        //TODO: Move into IrisDocument class
        let intMenuItem = '';
        if (docName.indexOf('.cls') > -1 ) {
            //TODO: Temp solution, replace with call to fetch full list
            let intDocName = docName.replace('.cls','.1.int');
            intMenuItem = `<div onclick="CloudStudioDirector.push('Model.DocumentsOpenForEdit','${intDocName}',true,true);">View .int Code</div>`
        }
        return `<div class="menu-divide"></div>
                ${intMenuItem}
            `
    }

    setTabLayoutInFocusByTabInfo(tabInfo) {
        let tabLayout = this.tabLayouts[tabInfo.tabLayoutUid];
        this.tabLayoutInFocus = {'uid': tabInfo.tabLayoutUid, 'colRowRef': tabLayout.parentInfo.colRowRef};
    }

    editorDidGetFocus(ev) {
        let tabLayout = this.tabLayouts[ev.tabLayout.id];
        this.tabLayoutInFocus = {'uid': ev.tabLayout.id, 'colRowRef': tabLayout.parentInfo.colRowRef};
    }

    tabLayoutGotFocus(tabLayout) {
        this.tabLayoutInFocus = {'uid': tabLayout.el.id, 'colRowRef': tabLayout.parentInfo.colRowRef};
    }

    //=========================================================================
    // MANAGE OUTER ELEMENTS FOR EDIT SPACE (COLUMNS AND ROWS FOR TABS)
    //=========================================================================
    appendNewColumnAndRow() {

        //append new column
        let colEl = $div('column')
        colEl.id = App.getAppItemUid();
        this.el.append(colEl)

        //append new row (only one row for now)
        let rowEl = $div('row')
        rowEl.id = App.getAppItemUid();
        colEl.append(rowEl);

        this.calculateColumnWidths();

        return {"colEl":colEl,"rowEl":rowEl}

    }

    calculateColumnWidths() {
        let colCount = this.el.childElementCount;
        for (let i=0; i<colCount; i++) {
            let col = this.el.childNodes[i];
            col.style.width = (100/colCount) + '%';
        }
    }

    prependNewColumnAndRow() {

    }

    isColumnInFocusTheLastColumn() {
        let tabLayoutInFocus = this.getTabLayoutInFocus();
        let focusedColumn = tabLayoutInFocus.parentInfo.colRowRef.colEl
        let lastColumn = this.el.lastElementChild;
        return (lastColumn === focusedColumn);
    }

    isColumnInFocusTheFirstColumn() {

    }

    //Edit space can have more than one tab layout, return the layout that's in focus, or was most recently in focus
    getTabLayoutInFocus() {
        let tabLayout = this.tabLayouts[this.tabLayoutInFocus.uid];
        if (tabLayout === undefined) {
            tabLayout = this.tabLayouts[Object.keys(this.tabLayouts)[0]]
            this.tabLayoutGotFocus(tabLayout);
        }
        return tabLayout;
    }

    //=========================================================================
    // HANDLE TAB MOVE ACTIONS
    //=========================================================================
    moveRight(docName) {
        let currentTabLayout = this.getTabLayoutInFocus();
        let nextTabLayout = undefined;
        if (this.isColumnInFocusTheLastColumn()) {
            let colRowRef = this.appendNewColumnAndRow()
            nextTabLayout = this.addTabLayoutToColumnRow(colRowRef)
        } else {
            let currentColumn = currentTabLayout.parentInfo.colRowRef.colEl;
            let nextColumn = currentColumn.nextElementSibling
            let layoutId = nextColumn.firstElementChild.firstElementChild.id;
            nextTabLayout = this.tabLayouts[layoutId];
        }
        let view = currentTabLayout.children[docName];
        this.addDocumentEditorToTabLayout(nextTabLayout,docName,view)
        currentTabLayout.remove(docName);
        this.removeEmptyTabLayouts();
        this.tabLayoutInFocus = nextTabLayout;
    }

    removeEmptyTabLayouts(keepOne = true) {
        this.eachTabLayout(tabLayout => {
            if (tabLayout.isEmpty() && (this.isOnlyTabLayout() === false)) {
                tabLayout.parentInfo.colRowRef.colEl.remove();
                delete this.tabLayouts[tabLayout.uid];
                this.calculateColumnWidths();
            }
        })
    }

    moveLeft(name) {
        //TODO
    }

    //=========================================================================
    // ACTIONS FOR CONTROLLING MONACO EDITOR
    //=========================================================================
    toggleMiniMap() {
        let isEnabled = AppDirector.toggle('Model.MiniMap');
        this.eachEditor( editor => {
            if (editor.type === 'monaco') editor.showMiniMap(isEnabled)
        })
    }

    toggleLineNumbers() {
        let isOnOrOff = AppDirector.toggle('Model.LineNumbers');
        this.eachEditor( editor => {
            if (editor.type === 'monaco') editor.showLineNumbers(isOnOrOff)
        })
    }

    setTheme(themeName) {
        if (themeName === 'light') {
            document.documentElement.setAttribute('light-theme', 'on');
            this.eachEditor( editor => {
                if (editor.type === 'monaco') editor.setThemeLight()
            });
        } else {
            document.documentElement.setAttribute('light-theme', 'off');
            this.eachEditor( editor => {
                if (editor.type === 'monaco') editor.setThemeDark()
            });
        }
    }

    foldAll() {
        let editor = this.getTabLayoutInFocus().getTabItemInFocus().editor;
        editor.trigger('fold','editor.foldAll')
    }

    foldLevel(level) {
        let editor = this.getTabLayoutInFocus().getTabItemInFocus().editor;
        editor.trigger('fold','editor.foldLevel' + level)
    }

    unfoldAll() {
        let editor = this.getTabLayoutInFocus().getTabItemInFocus().editor;
        editor.trigger('unfold','editor.unfoldAll')
    }

    setTextSize(size) {
        console.log('size',size)
        if (size === 'Small') document.body.style.fontSize = '10px';
        if (size === 'Normal') document.body.style.fontSize = '12px';
        if (size === 'Large') document.body.style.fontSize = '14px';
        if (size === 'ExtraLarge') document.body.style.fontSize = '16px';
    }

    selectAll() {
        this.getTabLayoutInFocus().getTabItemInFocus().selectAll();
    }

    undo() {
        this.getTabLayoutInFocus().getTabItemInFocus().undo();
    }

    redo() {
        this.getTabLayoutInFocus().getTabItemInFocus().redo();
    }

    cut() {
        this.getTabLayoutInFocus().getTabItemInFocus().cut();
    }

    copy() {
        this.getTabLayoutInFocus().getTabItemInFocus().copy();
    }

    paste() {
        this.getTabLayoutInFocus().getTabItemInFocus().paste();
    }

    delete() {
        this.getTabLayoutInFocus().getTabItemInFocus().delete();
    }

    //=========================================================================
    // UTILS
    //=========================================================================
    eachEditor(cb) {
        for (const uid in this.tabLayouts) {
            let tabLayout = this.tabLayouts[uid];
            for (let key in tabLayout.children) cb(tabLayout.children[key],tabLayout);
        }
    }

    eachTabLayout(cb) {
        for (const uid in this.tabLayouts) {
            let tabLayout = this.tabLayouts[uid];
            cb(tabLayout);
        }
    }

    isOnlyTabLayout() {
        let len = Object.keys(this.tabLayouts).length;
        return (len === 1);
    }

    //=========================================================================
    // STATUS BAR / CONSOLE WINDOW
    //=========================================================================
    toggleStatusWindow(forceOpen = false) {
        let statusWindow = document.getElementById('statusWindow');
        let statusWindowState = statusWindow.dataset.state;
        if (forceOpen === true && statusWindowState === 'open') return;
        let editSpace = document.getElementById('editSpaceContainer');
        if (forceOpen === true) statusWindow.dataset.state = 'closed';
        if (statusWindowState === 'open') {
            editSpace.style.bottom = '24px';
            statusWindow.style.height = '22px';
            statusWindow.dataset.state = 'closed'
        } else {
            editSpace.style.bottom = '142px';
            statusWindow.style.height = '140px';
            statusWindow.dataset.state = 'open'
        }
    }

    outputToConsole(data) {
        this.toggleStatusWindow(true);
        let outputWindow = document.getElementById('outputWindow');
        outputWindow.innerHTML = outputWindow.innerHTML + '<br>' + data + '<br>';
        outputWindow.scrollTop = outputWindow.scrollHeight
    }

    overflowItemSelected(name) {
        this.getTabLayoutInFocus().moveTabToStart(name);
        this.getTabLayoutInFocus().setTabItemInFocusByName(name);
    }

    viewOtherCode() {
        let tab = this.getTabLayoutInFocus().getTabItemInFocus();
        console.log(tab);
    }

    launchUtility(utilName) {
        let ns = AppDirector.get('Model.NameSpace');
        if (utilName === 'Management Portal') window.open(`/csp/sys/%25CSP.Portal.Home.zen?$NAMESPACE=${ns}`);
        if (utilName === 'SQL Explorer') window.open(`/csp/sys/exp/%25CSP.UI.Portal.SQL.Home.zen?$NAMESPACE=${ns}`);
        if (utilName === 'Class Reference') window.open(`/csp/documatic/%25CSP.Documatic.cls?LIBRARY=${ns}`);
        if (utilName === 'Production Configuration') window.open(`/csp/healthshare/${ns}/EnsPortal.ProductionConfig.zen?$NAMESPACE=${ns}`);
        if (utilName === 'Production Monitor') window.open(`/csp/healthshare/za/EnsPortal.ProductionMonitor.zen?$NAMESPACE=${ns}`);
        if (utilName === 'System Monitor') window.open(`/csp/sys/%25CSP.UI.Portal.EnsembleMonitor.zen?$NAMESPACE=${ns}`);
        if (utilName === 'Message Viewer') window.open(`/csp/healthshare/${ns}/EnsPortal.MessageViewer.zen?$NAMESPACE=${ns}`);
        if (utilName === 'Web Terminal') window.open(`http://localhost:52773/terminal/?NS=${ns}`);
    }

    launchHelp(helpName) {
        if (helpName === 'InterSystems Documentation') window.open(`https://docs.intersystems.com/`);
        if (helpName === 'InterSystems Community') window.open(`https://community.intersystems.com/`);
        if (helpName === 'InterSystems Discord') window.open(`https://discord.com/channels/698987699406766170/707503143092486145`);
        if (helpName === 'CloudStudio GitHub') window.open(`https://github.com/SeanConnelly/CloudStudio`);
        if (helpName === 'CloudStudio Discord') window.open(`https://discord.com/channels/985944773078683649/985944773078683652`);
    }

    minimiseExplorer() {
        let explorerPanel=document.getElementById('explorerPanel');
        let editSpaceContainer=document.getElementById('editSpaceContainer');
        let statusWindow=document.getElementById('statusWindow');
        if (explorerPanel.dataset.state === 'closed') {
            let width = explorerPanel.style.width;
            if (width === '') width = '220px';
            explorerPanel.style.left = '0';
            editSpaceContainer.style.left = (parseInt(width,10) + 2) + 'px';
            statusWindow.style.left = (parseInt(width,10) + 2) + 'px';
            explorerPanel.dataset.state = 'open'
        } else {
            explorerPanel.style.left = '-1000px';
            editSpaceContainer.style.left = '0';
            statusWindow.style.left = '0'
            explorerPanel.dataset.state = 'closed';
        }
    }

    explorerDragbarStart() {
        //large tree causes repaint jank, shift explorer hard right and then recalc at last second to prevent jank
        let explorerPanel=document.getElementById('explorerPanel');
        explorerPanel.style.width = '497px';
        document.addEventListener("mousemove", EditSpace.explorerDragbarMove);
        document.addEventListener("mouseup", EditSpace.explorerDragbarDone)
        document.addEventListener("mouseleave", EditSpace.explorerDragbarDone)
    }

    static explorerDragbarDone(ev) {
        let explorerPanel=document.getElementById('explorerPanel');
        EditSpace.explorerDragbarMove(ev)
        explorerPanel.style.width = explorerPanel.dataset.movewidth;
        document.removeEventListener("mousemove",EditSpace.explorerDragbarMove);
        document.removeEventListener("mouseup",EditSpace.explorerDragbarDone);
        document.removeEventListener("mouseleave",EditSpace.explorerDragbarDone);
    }

    static explorerDragbarMove(ev) {
        let explorerPanel=document.getElementById('explorerPanel');
        let editSpaceContainer=document.getElementById('editSpaceContainer');
        let statusWindow=document.getElementById('statusWindow');
        let explorerDragbar=document.getElementById('explorerDragbar');
        if ((ev.clientX>160) && (ev.clientX<500)) {
            explorerPanel.dataset.movewidth = (ev.clientX - 1) + 'px';
            editSpaceContainer.style.left = (ev.clientX + 1) + 'px';
            statusWindow.style.left = (ev.clientX + 1) + 'px';
            explorerDragbar.style.left = (ev.clientX - 3) + 'px';
        }
    }

    outputDragbarStart() {
        let statusWindow=document.getElementById('statusWindow');
        if (statusWindow.dataset.state === 'closed') return;
        document.addEventListener("mousemove", EditSpace.outputDragbarMove);
        document.addEventListener("mouseup", EditSpace.outputDragbarDone);
        document.addEventListener("mouseleave", EditSpace.outputDragbarDone);
    }

    static outputDragbarMove(ev) {
        let editSpaceContainer=document.getElementById('editSpaceContainer');
        let statusWindow=document.getElementById('statusWindow');
        if ((ev.clientY<(window.innerHeight-100)) && (ev.clientY>(window.innerHeight/3))) {
            editSpaceContainer.style.bottom = `calc(100vh - ${(ev.clientY - 1)}px`;
            statusWindow.style.height = `calc(100vh - ${(ev.clientY + 1)}px`;
        }
    }

    static outputDragbarDone(ev) {
        document.removeEventListener("mousemove",EditSpace.outputDragbarMove);
        document.removeEventListener("mouseup",EditSpace.outputDragbarDone);
        document.removeEventListener("mouseleave",EditSpace.outputDragbarDone);
    }

}

let newItemPromptText = {
    "Registered": {Text:"Registered Class",Type:"CLS"},
    "Persistent": {Text:"Persistent Class",Type:"CLS"},
    "Registered XML": {Text:"Registered Class",Type:"CLS"},
    "Persistent XML": {Text:"Persistent Class",Type:"CLS"},
    "Serial": {Text:"Serial Class",Type:"CLS"},
    "Abstract": {Text:"Serial Abstract",Type:"CLS"},
    "CSP": {Text:"CSP Class",Type:"CLS"},
    "Routine": {Text:"ObjectScript Routine",Type:"MAC"},
    "Macro": {Text:"Macro File",Type:"INC"},
    "Intermediary": {Text:"Intermediary Routine",Type:"INT"}
}










/*

Developer Notes
===============

App
 ↪ EditSpace
    ↪ ColumnLayout
       ↪ Column (collection)
          ↪ RowLayout
             ↪ Row (collection)
                ↪ TabLayout
                   ↪ Tab (collection)
                      ↪ Editor
*/
