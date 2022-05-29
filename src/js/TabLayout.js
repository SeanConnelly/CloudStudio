import {AppDirector} from './AppDirector.js';

export class TabLayout {

    /**
     * TODO: V0.1 built in plain old JS, using JSDOC briefly before moving solution to TypeScript (v0.3)
     * @param config Generic config for all views
     * @param {('top'|'bottom')} config.position Position of tabs
     * @param {boolean} config.overflow Display button for overflow dropdown menu
     * @param {string} config.group Provide a name where multiple tab layouts share focus
     * @param {string} config.uid unique id for items in the app
     * @param {object} config.parentInfo parent view
     */
    constructor(config = {}) {
        this.config = config;
        this.type = "TabPanel";
        this.children = {};
        this.tabNameInFocus = '';
        this.uid = config.uid;
        this.parentInfo = config.parentInfo;
    }

    //=========================================================================
    // MOUNT AND RENDER PARENT STRUCTURE OF TAB LAYOUT
    //=========================================================================
    mount(el) {
        this.parentEl = el;
        (this.config.position === 'bottom') ? this.renderTabsBottom() : this.renderTabsTop();
        this.el = this.parentEl.firstElementChild;
        this.el.id = this.uid;
        this.tabsEl = el.querySelector('.tab-layout--tabs');
        this.bodyEl = el.querySelector('.tab-layout--body');
        this.registerEvents();
    }

    renderTabsTop() {
        this.parentEl.innerHTML = `<div class="tab-layout ">
            <div class="tab-layout--tabs"></div>
            ${(this.config.overflow) ? `
            <div class="tab-layout--overflow-button">
                <button class="flex-right menu-top-button rel" id="file-menu">
                    <i class="fas fa-caret-down"></i>
                    <div class="sub-menu menu-below-right">
                    </div>
                </button>
            </div>` : ''}
            <div class="tab-layout--body"></div>
        </div>`;
        this.overFlowMenuEl=this.parentEl.querySelector('.sub-menu');
    }

    renderTabsBottom() {
        this.parentEl.innerHTML = `<div class="tab-panel">
            <div class="tab-layout--body"></div>
            <div class="tab-layout--tabs"></div>            
        </div>`;
    }

    registerEvents() {
        this.tabsEl.addEventListener('click', (ev) => this.onContextMenuClick(ev))
    }

    //=========================================================================
    // CONTEXT MENU
    //=========================================================================
    onContextMenuClick(ev) {
        let tabName = this.getTabNameFromChildEl(ev.target);
        AppDirector.set('Action.SetTabItemInFocusByName',{"tabName":tabName,"tabLayoutUid":this.uid})
        this.setTabItemInFocusByName(tabName);
        if (ev.target.parentElement.classList.contains('sub-menu')) {
            let action = ev.target.innerText;
            AppDirector.set("Actions.EditorTabContextMenu",{'action':action,'name':tabName});
            ev.target.parentElement.parentElement.blur();
        }
    }

    getTabNameFromChildEl(el) {
        return el.closest('[data-name]').dataset.name;
    }

    //=========================================================================
    // ADD NEW TAB TO LAYOUT
    //=========================================================================
    addNewTabToLayout(tabName,tabBodyView,tabContextMenuFragment) {
        this.addTabHeader(tabName,tabContextMenuFragment)
        this.addTabBody(tabName,tabBodyView)
        this.addOverflowItem(tabName)
    }

    addTabBody(tabName,tabBodyView) {
        this.children[tabName] = tabBodyView;
        tabBodyView.mount(this.bodyEl);
        tabBodyView.show();
        this.setTabItemInFocusByName(tabName);
    }

    addTabHeader(tabName,tabContextMenuFragment) {
        this.tabsEl.insertAdjacentHTML('afterbegin',
            `<div class="tab-layout--tab" data-name="${tabName}">${tabName}<button class="rel menu-tab-button"><i class="fa fa-angle-down"></i>
                <div class="sub-menu menu-below">${this.getTabCommonMenuFragmentForTab()}${tabContextMenuFragment}</div>
            </button></div>`
        )
    }

    addOverflowItem(name) {
        this.overFlowMenuEl.insertAdjacentHTML('afterbegin',`<div data-id="${name}">${name}</div>`);
    }

    getTabCommonMenuFragmentForTab() {
        return `<div class="disabled">Close</div>
            <div class="disabled">Close Others</div>
            <div class="disabled">Close Others Right</div>
            <div class="disabled">Close Others Left</div>
            <div className="menu-divide"></div>
            <div>Move Right</div>
            <div class="disabled">Move Left</div>`
    }

    //=========================================================================
    // REMOVE TAB FROM LAYOUT
    //=========================================================================
    remove(name) {
        delete this.children[name];
        this.tabsEl.querySelector(`[data-name="${name}"]`).remove();
        this.overFlowMenuEl.querySelector(`[data-id="${name}"]`).remove();
        if (this.tabNameInFocus === name) {
            let first = this.tabsEl.firstElementChild;
            if (first) this.setTabItemInFocusByName(first.dataset.name);
        }
    }

    isEmpty() {
        let empty = true;
        for (const p in this.children) {
            empty = false;
        }
        return empty;
    }

    //=========================================================================
    // SET / GET TAB IN FOCUS
    //=========================================================================
    setTabItemInFocusByName(name) {
        //un-focus and hide other tabs
        let focused = this.tabsEl.querySelector('.tab-layout--tab-focused')
        if (focused) focused.classList.remove('tab-layout--tab-focused')
        for (let child in this.children) {
            this.children[child].hide();
        }
        //focus and show this tab
        this.tabsEl.querySelector(`[data-name="${name}"]`).classList.add('tab-layout--tab-focused');
        this.children[name].show();
        this.tabNameInFocus = name;
    }

    getTabItemInFocus() {
        return this.children[this.tabNameInFocus];
    }

}