import {AppDirector} from './AppDirector.js';
import {CompletionItemDictionary} from './iris/CompletionItemDictionary.js';
import {Document} from './iris/Document.js'

export class Explorer {

    constructor() {
        this.codeTreeEl = document.getElementById('explorer-tree');
        this.codeTreeEl.addEventListener('dblclick', ev => this.menuAction(ev));
        this.codeTreeEl.addEventListener('touchstart', ev => this.menuAction(ev));
        AppDirector.bindInnerText('namespace','Model.NameSpace');
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

    swapNamespace(ns) {
        let folder = name => `<div class="explorer-tree-node"><i class="fa-solid fa-folder folder-color"></i> ${name}<div class="explorer-tree-hidden" id="explorer-node-${name}"><span class="pad-left-1em"><i class="fas fa-spinner fa-spin"></i> Loading</span></div></div>`
        this.codeTreeEl.innerHTML = folder('Classes') + folder('Routines') + folder('Web') + folder('Other');
        document.activeElement.blur();
        this.codeTree = {Classes:{},Routines:{},Web:{},Other:{}};
        this.loadClasses(ns);
        this.loadRoutines(ns);
        this.loadWeb(ns)
        this.loadOther(ns);
    }

    loadClasses(ns) {
        Document.listAllByType(ns,'CLS').then( data => {
            data.result.content.map(item =>  {
                if ((item.db.indexOf('IRIS') === 0) && (ns !== '%SYS')) return;
                if (item.db.indexOf('IRIS') === 0) CompletionItemDictionary.addClassItem(item.name);
                this.addTreeItem(this.codeTree.Classes,item);
                CompletionItemDictionary.addClassItem(item.name);
            })
            document.getElementById('explorer-node-Classes').innerHTML = this.walkTreeMakeHTML(this.codeTree.Classes);
        })
    }

    loadRoutines(ns) {
        Document.listAllByType(ns,'RTN').then( data => {
            data.result.content.map(item => this.addTreeItem(this.codeTree.Routines,item))
            document.getElementById('explorer-node-Routines').innerHTML = this.walkTreeMakeHTML(this.codeTree.Routines);
        })
    }

    loadWeb(ns) {
        Document.listAllByType(ns,'CSP').then( data => {
            data.result.content.map(item => this.addCspTreeItem(this.codeTree.Web,item))
            document.getElementById('explorer-node-Web').innerHTML = this.walkTreeMakeHTML(this.codeTree.Web);
        })
    }

    loadOther(ns) {
        Document.listAllByType(ns,'OTH').then( data => {
            data.result.content.map(item => this.addOtherItem(this.codeTree.Other,item))
            document.getElementById('explorer-node-Other').innerHTML = this.walkTreeMakeHTML(this.codeTree.Other);
        })
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
        let type = nodes.pop().toUpperCase();
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

    walkTreeMakeHTML(parentFolder) {
        let foldersHtml = '';
        let filesHtml = '';
        Object.getOwnPropertyNames(parentFolder).map( folderName => {
            let child = parentFolder[folderName];
            if (folderName.indexOf('|') !== 0) {
                foldersHtml += this.makeFolderHtmlNode(folderName,this.walkTreeMakeHTML(child));
            } else {
                filesHtml += this.makeFileHtmlNode(child.fullName,child.name);
            }
        })
        return foldersHtml + filesHtml;
    }

    makeFolderHtmlNode(folderName,subFolders) {
        return `<div class="explorer-tree-node">
                  <i class="fa-solid fa-folder folder-color"></i> ${folderName}
                  <div class="explorer-tree-hidden">${subFolders}</div>
                </div>`
    }

    makeFileHtmlNode(fileName,displayName) {
        return `<div class="explorer-tree-leaf" data-name="${fileName}">
                    <span class="nowrap"><i class="fa-solid fa-file-lines"></i> ${displayName}</span>
                </div>`
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

    addNodeToHTML(type,name) {
        if (type === 'CLS') {

        }
    }

}

