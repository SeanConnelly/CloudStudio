import {AppDirector} from './AppDirector.js';
import {Explorer} from './Explorer.js';
import {EditSpace} from './EditSpace.js';
import {TopMenu} from './TopMenu.js';
import {} from './Languages.js';  //required to load ObjectScript language into Monaco at startup

const $cssVar = (key,val) => document.documentElement.style.setProperty('--' + key, val);

export class App {

    static app = undefined;

    static appItemUidCounter = 0;

    static getAppItemUid() {
        App.appItemUidCounter++;
        return 'UID#' + App.appItemUidCounter;
    }

    constructor() {

        App.app = this;

        //elements
        this.editSpaceEl = document.getElementById('editSpaceContainer')

        //views
        this.explorer = new Explorer();
        this.editSpace = new EditSpace();
        this.topmenu = new TopMenu();  //NB: needed to initialise menu

        //mounts
        this.editSpace.mount(this.editSpaceEl)

        //initialise (for now, debounce to allow Index page to init AppData defaults, todo: refactor to remove debounce)
        window.setTimeout(() => this.initialise(),25);

    }

    initialise() {

        //register handlers
        this.registerEvents()
        this.registerFunctionKeys()
        this.registerMouseRightClick();

        //init default values
        let ns = new URLSearchParams(window.location.search).get('ns');
        AppDirector.init('Model.NameSpace',(ns || AppDirector.get('Model.NameSpace') || (CloudStudioAppDefault.NS)),true)
        AppDirector.init('Model.Theme','dracula',true);
        AppDirector.init('Model.LineNumbers','off',true);
        AppDirector.init('Model.MiniMap',true,true);

        //restore app data
        AppDirector.restoreData();

    }

    registerEvents() {

        //actions
        AppDirector.on('Action.ShowLineNumbers', toggle => this.editSpace.toggleLineNumbers());
        AppDirector.on('Action.ShowMiniMap', toggle => this.editSpace.toggleMiniMap());
        AppDirector.on('Action.ReloadPage', () => window.location.reload());
        AppDirector.on('Action.ResetPage', () => {localStorage.clear();window.location.reload()});
        AppDirector.on('Action.ToggleFullScreen', () => document.body.requestFullscreen());
        AppDirector.on('Action.StatusWindow', (content) => this.editSpace.toggleStatusWindow(content));
        AppDirector.on('Action.Save', () => this.editSpace.saveDocumentInFocus());
        AppDirector.on('Action.Compile', () => this.editSpace.compileDocumentInFocus());
        AppDirector.on('Action.FoldAll', () => this.editSpace.foldAll());
        AppDirector.on('Action.UnfoldAll', () => this.editSpace.unfoldAll());
        AppDirector.on('Action.SetTabItemInFocusByName', (tabInfo) => this.editSpace.setTabLayoutInFocusByTabInfo(tabInfo));
        AppDirector.on('Action.New', (docType) => this.editSpace.newDocument(docType));
        AppDirector.on('Action.MakeNew', (docNameType) => this.editSpace.makeNewDocument(docNameType));
        AppDirector.on('Action.SwapNamespace', (ns) => { AppDirector.set('Model.DocumentsOpenForEdit',''); window.location = `${window.location.href.split('?')[0]}?ns=${ns}`;  });
        AppDirector.on('Action.ExpandAll', () => this.explorer.expandAll());
        AppDirector.on('Action.CollapseAll', () => this.explorer.collapseAll());
        AppDirector.on('Action.OverflowItemSelected', (item) => this.editSpace.overflowItemSelected(item.dataset.name) );
        AppDirector.on('Action.TabLayoutGotFocus', (tl) => this.editSpace.tabLayoutGotFocus(tl));
        AppDirector.on('Action.ViewOtherCode', () => this.editSpace.viewOtherCode());
        AppDirector.on('Action.LaunchUtility', (utilName) => this.editSpace.launchUtility(utilName));
        AppDirector.on('Action.LaunchHelp', (helpName) => this.editSpace.launchHelp(helpName));
        AppDirector.on('Action.TextSize', (size) => this.editSpace.setTextSize(size));

        //editor got focus
        AppDirector.on('Message.EditorDidGetFocus', (ev) => this.editSpace.editorDidGetFocus(ev));

        //models
        AppDirector.on('Model.AccentColor', color => $cssVar('appPrimaryColor', 'var(--' + color + ')'));
        AppDirector.on('Model.Appearance', themeName => this.editSpace.setTheme(themeName));
        AppDirector.on('Model.NameSpace', (ns) => this.explorer.swapNamespace(ns) );
        AppDirector.on('Model.DocumentsOpenForEdit', docName => this.editSpace.openDocumentForEdit(docName) );


        //messages
        AppDirector.on('Message.Console', (data) => this.editSpace.outputToConsole(data));
        AppDirector.bindInnerText('CursorPosition',"Message.CursorPosition", data => `${data.lineNumber || 0}:${data.column || 0}` );

        //TODO: Refactor this...
        AppDirector.on('Actions.EditorTabContextMenu', data => {
            if (data.action === 'Close') this.editSpace.closeDocument(data.name);
            if (data.action === 'Move Right') this.editSpace.moveRight(data.name);
            if (data.action === 'Move Left') this.editSpace.moveLeft(data.name);
        })

    }

    // === CONTEXT MENU EVENT HANDLER ===
    // Generic listener for context menu (mouse right click). If the target element of the event
    // has [ data-event="contextmenu" ] then forward the event to the AppData controller and
    // prevent the default. AppData will delegate the event to its registered handler(s).
    registerMouseRightClick() {
        window.addEventListener('contextmenu', ev => {
            if (ev.target.dataset.event === 'contextmenu') {
                AppDirector.set('ContextMenu',ev);
            }
            //disable it by default, this is an app not a browser session
            ev.preventDefault();
        })
    }

    registerFunctionKeys() {
        window.onkeydown = e => {
            if (e.key === 'F2') AppDirector.set("Action.Compile");
        };
    }

}