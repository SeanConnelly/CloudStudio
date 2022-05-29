import {App} from './App.js';
import {TabLayout} from "./TabLayout.js";
import {IrisDocument} from "./IrisDocument.js";
import {AppDirector} from "./AppDirector.js";
import {Editor} from "./Editor.js";
import {PromptBox} from "./Prompt.js"
import {CodeTemplates} from "./CodeTemplates.js";

//smallest dom lib in the world
const $div = (...cl) => { let div = document.createElement('div'); if (cl) div.classList.add(...cl); return div}

export class EditSpace {

    constructor() {
        this.el = $div('fit','flex-row');    //root element of the edit space
        this.tabLayoutInFocus = undefined;      //track the most recent tab layout in focus
        this.statusWindowOpen = false;          //track open state of status / console window
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
        let ns = AppDirector.get('Model.NameSpace');
        IrisDocument.open(ns,docName).then(doc => {
            let editor = new Editor(doc);
            this.addDocumentEditorToTabLayout(this.getTabLayoutInFocus(),docName,editor)
        })
    }

    saveDocumentInFocus() {
        let editor = this.getTabLayoutInFocus().getTabItemInFocus();
        editor.save();
    }

    compileDocumentInFocus() {
        let editor = this.getTabLayoutInFocus().getTabItemInFocus();
        editor.compile();
    }

    newDocument(docType) {
        let text=newItemPromptText[docType].Text;
        let extension=newItemPromptText[docType].Type
        this.promptBox = new PromptBox(`Enter New ${text} Name`,extension,docType)
    }

    makeNewDocument(docNameType) {
        let fullDocName = docNameType.name + '.' + docNameType.type.toLowerCase();
        let src = CodeTemplates.GetTemplate(docNameType.docType,docNameType.name);
        let doc = new IrisDocument(AppDirector.get('Model.NameSpace'),fullDocName,src);
        let editor = new Editor(doc);
        this.addDocumentEditorToTabLayout(this.getTabLayoutInFocus(),fullDocName,editor)
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
        tabLayout.addNewTabToLayout(docName,documentEditor,this.getTabContextMenuFragmentForDocument());
    }

    getTabContextMenuFragmentForDocument() {
        //TODO: Place holder for custom context menu
        return ``
    }

    setTabLayoutInFocusByTabInfo(tabInfo) {
        let tabLayout = this.tabLayouts[tabInfo.tabLayoutUid];
        this.tabLayoutInFocus = {'uid': tabInfo.tabLayoutUid, 'colRowRef': tabLayout.parentInfo.colRowRef};
    }

    editorDidGetFocus(ev) {
        let tabLayout = this.tabLayouts[ev.tabLayout.id];
        this.tabLayoutInFocus = {'uid': ev.tabLayout.id, 'colRowRef': tabLayout.parentInfo.colRowRef};
    }

    //=========================================================================
    // MANAGE OUTER ELEMENTS FOR EDIT SPACE (COLUMNS AND ROWS FOR TABS)
    //=========================================================================
    appendNewColumnAndRow() {

        //append new flex column to end of edit space
        let colEl = $div('flex-1','flex-col')
        colEl.id = App.getAppItemUid();
        this.el.append(colEl)

        //append new flex row inside the new column
        let rowEl = $div('flex-1')
        rowEl.id = App.getAppItemUid();
        colEl.append(rowEl);

        return {"colEl":colEl,"rowEl":rowEl}

    }

    prependNewColumnAndRow() {

    }

    isColumnInFocusTheLastColumn() {
        let focusedColumn = this.tabLayoutInFocus.colRowRef.colEl
        let lastColumn = this.el.lastElementChild;
        return (lastColumn === focusedColumn);
    }

    isColumnInFocusTheFirstColumn() {

    }

    //Edit space can have more than one tab layout, return the layout that's in focus, or was most recently in focus
    getTabLayoutInFocus() {
        return this.tabLayouts[this.tabLayoutInFocus.uid];
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
        if (currentTabLayout.isEmpty()) {
            console.log('oh no, its empty!');
            console.dir(currentTabLayout);
            currentTabLayout.parentInfo.colRowRef.colEl.remove();
            delete this.tabLayouts[currentTabLayout.uid];
        }
    }

    moveLeft(name) {
        //TODO
    }

    //=========================================================================
    // ACTIONS FOR CONTROLLING MONACO EDITOR
    //=========================================================================
    toggleMiniMap() {
        let isEnabled = AppDirector.toggle('Model.MiniMap');
        this.eachEditor( editor => editor.showMiniMap(isEnabled))
    }

    toggleLineNumbers() {
        let isOnOrOff = AppDirector.toggle('Model.LineNumbers');
        this.eachEditor( editor => editor.showLineNumbers(isOnOrOff))
    }

    setTheme(themeName) {
        if (themeName === 'light') {
            document.documentElement.setAttribute('light-theme', 'on');
            this.eachEditor( editor => editor.setThemeLight());
        } else {
            document.documentElement.setAttribute('light-theme', 'off');
            this.eachEditor( editor => editor.setThemeDark());
        }
    }

    foldAll() {
        let editor = this.getTabLayoutInFocus().getTabItemInFocus().editor;
        editor.trigger('fold','editor.foldAll')
    }

    unfoldAll() {
        let editor = this.getTabLayoutInFocus().getTabItemInFocus().editor;
        editor.trigger('unfold','editor.unfoldAll')
    }

    //=========================================================================
    // UTILS
    //=========================================================================
    eachEditor(cb) {
        for (const uid in this.tabLayouts) {
            let tabLayout = this.tabLayouts[uid];
            for (let key in tabLayout.children) cb(tabLayout.children[key]);
        }
    }

    //=========================================================================
    // STATUS BAR / CONSOLE WINDOW
    //=========================================================================
    toggleStatusWindow(forceOpen = false) {
        let editSpace = document.getElementById('editSpaceContainer');
        let statusWindow = document.getElementById('statusWindow');
        if (forceOpen === true) this.statusWindowOpen = false;
        if (this.statusWindowOpen) {
            editSpace.style.bottom = '24px';
            statusWindow.style.height = '22px';
        } else {
            editSpace.style.bottom = '142px';
            statusWindow.style.height = '140px';
        }
        this.statusWindowOpen = !this.statusWindowOpen;
    }

    outputToConsole(data) {
        this.toggleStatusWindow(true);
        let outputWindow = document.getElementById('outputWindow');
        outputWindow.innerHTML = outputWindow.innerHTML + '<br>' + data + '<br>';
        outputWindow.scrollTop = outputWindow.scrollHeight
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
