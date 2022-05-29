import {AppDirector} from './AppDirector.js';

export class Explorer {

    constructor() {
        this.codeTreeEl = document.getElementById('explorer-tree');
        this.codeTreeEl.addEventListener('dblclick', ev => {
            this.toggleFolder(ev);
            this.openFile(ev);
        })
        AppDirector.bindInnerText('namespace','Model.NameSpace');
    }

    swapNamespace(ns) {
        this.codeTreeEl.innerHTML = '<div class="pad-3em center width100"><br><br>Fetching Data<br><br><i class="fas fa-spinner fa-spin"></i></div>';
        document.activeElement.blur();
        this.loadNamespace(ns);
    }

    toggleFolder(ev) {
        let el = ev.target;
        if (el.tagName !== 'DIV') el = el.parentElement;
        if (el.tagName !== 'DIV') el = el.parentElement;
        if (!el.classList.contains('explorer-tree-node')) return;
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

    openFile(ev) {
        let el = ev.target;
        if (el.tagName !== 'DIV') el = el.parentElement;
        if (el.tagName !== 'DIV') el = el.parentElement;
        if (!el.classList.contains('explorer-tree-leaf')) return;
        AppDirector.push('Model.DocumentsOpenForEdit',el.dataset.name,true);
    }

    //TODO: Preload top level packages and folder, then lazy load full contents of each as needed
    loadNamespace(ns) {
        fetch(`/api/atelier/v1/${encodeURI(ns)}/docnames`) .then( res => res.json()).then( data => {
            this.updateCodeTree(data);
            this.renderCodeTree();
        })
    }

    updateCodeTree(data) {
        this.codeTree = {Classes:{},Routines:{},Web:{},Other:{}};
        let namespace = AppDirector.get('namespace');
        for (let item of data.result.content) {
            if ((item.db.indexOf('IRIS') === 0) && (namespace !== '%SYS')) continue;
            if (item.cat === 'CLS') this.addTreeItem(this.codeTree.Classes,item);
            if (item.cat === 'RTN') this.addTreeItem(this.codeTree.Routines,item);
            if (item.cat === 'CSP') this.addCspTreeItem(this.codeTree.Web,item);
            if (item.cat === 'OTH') this.addTreeItem(this.codeTree.Other,item);
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

    addItemToTree(root,nodes,fullName) {
        let name = nodes.pop();
        nodes.map( node => {
            if (root[node] === undefined) root[node] = {};
            root = root[node];
        })
        root['|'+name] = {"name":name,"fullName":fullName}; //add pipe prefix to separate nodes from leaves with same name
    }

    renderCodeTree() {
        this.codeTreeEl.innerHTML = this.walkTreeMakeHTML(this.codeTree);
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

}

