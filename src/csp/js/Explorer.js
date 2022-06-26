import {AppDirector} from './AppDirector.js';
import {CompletionItemDictionary} from './iris/CompletionItemDictionary.js';

export class Explorer {

    constructor() {
        this.codeTreeEl = document.getElementById('explorer-tree');
        this.codeTreeEl.addEventListener('dblclick', ev => this.menuAction(ev));
        this.codeTreeEl.addEventListener('touchstart', ev => this.menuAction(ev));
        AppDirector.bindInnerText('namespace','Model.NameSpace');
    }

    swapNamespace(ns) {
        //'<div class="pad-3em center width100"><br><br>Initialising Namespace Connection<br><br><i class="fas fa-spinner fa-spin"></i></div>';
        let folder = name => `<div class="explorer-tree-node"><i class="fa-solid fa-folder folder-color"></i> ${name}<div class="explorer-tree-hidden" id="explorer-node-${name}"><span class="pad-left-1em"><i class="fas fa-spinner fa-spin"></i> Loading</span></div></div>`
        this.codeTreeEl.innerHTML = folder('Classes') + folder('Routines') + folder('Web') + folder('Other');
        document.activeElement.blur();
        this.loadNamespace(ns);
    }

    menuAction(ev) {
        let el = ev.target.closest('div');
        if (el.classList.contains('explorer-tree-node')) this.toggleFolder(el,ev);
        if (el.classList.contains('explorer-tree-leaf')) AppDirector.push('Model.DocumentsOpenForEdit',el.dataset.name,true);
    }

    toggleFolder(el,ev) {
        if (el.lastElementChild.classList.contains('explorer-tree-hidden')) {
            el.lastElementChild.classList.remove('explorer-tree-hidden');
            el.firstElementChild.classList.remove('fa-folder');
            el.firstElementChild.classList.add('fa-folder-open');
        } else {
            el.lastElementChild.classList.add('explorer-tree-hidden');
            el.firstElementChild.classList.add('fa-folder');
            el.firstElementChild.classList.remove('fa-folder-open');
        }
    }

    //TODO: Preload top level packages and folder, then lazy load full contents of each as needed
    // /docnames/:cat/:type?filter=
    // cat = *,CLS,RTN,CSP,OTH
    // type = cls,mac,int,inc,bas,mvi,mvb
    // filter = Name Like %filter%
    loadNamespace(ns) {
        this.codeTree = {Classes:{},Routines:{},Web:{},Other:{}};
        this.loadClasses(ns);
        this.loadRoutines(ns);
        this.loadWeb(ns)
        this.loadOther(ns);
    }

    loadClasses(ns) {
        fetch(`/api/atelier/v1/${encodeURI(ns)}/docnames/CLS`) .then( res => res.json()).then( data => {
            this.updateCodeTree(ns,data);
            document.getElementById('explorer-node-Classes').innerHTML = this.walkTreeMakeHTML(this.codeTree.Classes);
        })
    }

    loadRoutines(ns) {
        fetch(`/api/atelier/v1/${encodeURI(ns)}/docnames/RTN`) .then( res => res.json()).then( data => {
            this.updateCodeTree(ns,data);
            document.getElementById('explorer-node-Routines').innerHTML = this.walkTreeMakeHTML(this.codeTree.Routines);
        })
    }

    loadWeb(ns) {
        fetch(`/api/atelier/v1/${encodeURI(ns)}/docnames/CSP`) .then( res => res.json()).then( data => {
            this.updateCodeTree(ns,data);
            document.getElementById('explorer-node-Web').innerHTML = this.walkTreeMakeHTML(this.codeTree.Web);
        })
    }

    loadOther(ns) {
        fetch(`/api/atelier/v1/${encodeURI(ns)}/docnames/OTH`) .then( res => res.json()).then( data => {
            this.updateCodeTree(ns,data);
            document.getElementById('explorer-node-Other').innerHTML = this.walkTreeMakeHTML(this.codeTree.Other);
        })
    }

    updateCodeTree(ns,data) {
        for (let item of data.result.content) {
            if (item.db.indexOf('IRIS') === 0) CompletionItemDictionary.addClassItem(item.name);
            if ((item.db.indexOf('IRIS') === 0) && (ns !== '%SYS')) continue;
            if (item.cat === 'CLS') {
                this.addTreeItem(this.codeTree.Classes,item);
                CompletionItemDictionary.addClassItem(item.name);
            }
            if (item.cat === 'RTN') this.addTreeItem(this.codeTree.Routines,item);
            if (item.cat === 'CSP') this.addCspTreeItem(this.codeTree.Web,item);
            if (item.cat === 'OTH') this.addOtherItem(this.codeTree.Other,item);
        }
    }

    addTreeItem(root,item) {
        let nodes = item.name.split('.');
        let type = nodes.pop();
        nodes.push(nodes.pop() + '.' + type)
        this.addItemToTree(root,nodes,item.name);
    }

    addCspTreeItem(root,item) {
        let nodes = item.name.split('/');
        nodes.shift(); //remove first folder part as its always blank
        this.addItemToTree(root,nodes,item.name);
    }

    addOtherItem(root,item) {
        let nodes = item.name.split('.');
        let type = nodes.pop();
        if (type === 'HL7') nodes = [nodes.join('.')]
        nodes.unshift(type);
        nodes.push(nodes.pop() + '.' + type)
        this.addItemToTree(root,nodes,item.name);
    }

    addItemToTree(root,nodes,fullName) {
        let name = nodes.pop();
        nodes.map( node => {
            if (root[node] === undefined) root[node] = {};
            root = root[node];
        })
        root['|'+name] = {"name":name,"fullName":fullName}; //add pipe prefix to separate nodes from leaves with same name
    }

    walkTreeMakeHTML(parentNode) {
        let html1 = '';
        let html2 = '';
        Object.getOwnPropertyNames(parentNode).map( key => {
            let childNode = parentNode[key];
            if (key.indexOf('|') !== 0) {
                html1 = html1 + `<div class="explorer-tree-node">
                                    <i class="fa-solid fa-folder folder-color"></i> ${key}
                                    <div class="explorer-tree-hidden">${this.walkTreeMakeHTML(childNode)}</div>
                                 </div>`;
            } else {
                html2 = html2 + `<div class="explorer-tree-leaf" data-name="${childNode.fullName}">
                                    <span class="nowrap"><i class="fa-solid fa-file-lines"></i> ${childNode.name}</span>
                                 </div>`;
            }
        })
        return html1 + html2;
    }

    expandAll() {
        let nodes = this.codeTreeEl.querySelectorAll('.explorer-tree-node');
        for (let i=0; i< nodes.length; i++) {
            let el = nodes[i];
            el.lastElementChild.classList.remove('explorer-tree-hidden');
            el.firstElementChild.classList.remove('fa-folder');
            el.firstElementChild.classList.add('fa-folder-open');
        }
    }

    collapseAll() {
        let nodes = this.codeTreeEl.querySelectorAll('.explorer-tree-node');
        for (let i=0; i< nodes.length; i++) {
            let el = nodes[i];
            el.lastElementChild.classList.add('explorer-tree-hidden');
            el.firstElementChild.classList.add('fa-folder');
            el.firstElementChild.classList.remove('fa-folder-open');
        }
    }

}

