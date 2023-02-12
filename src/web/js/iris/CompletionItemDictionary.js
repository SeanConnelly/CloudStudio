import {Dictionary} from './Dictionary.js';
import {System} from "./System.js";
import {AppDirector} from "../AppDirector.js";
import {Scanner} from "./Scanner.js"

export class CompletionItemDictionary {

    static clsItems = {'_root':[]};

    static addClassItem(className) {
        let subNames = className.split('.');
        subNames.pop()  //discard '.cls'
        let rootName = subNames[0];
        CompletionItemDictionary.addClassCompletionItem('_root',rootName);
        for (let i=1; i<(subNames.length); i++) {
            let parentSubName = subNames.slice(0,i).join('.');
            let childSubName = subNames[i];
            let lastChild = (i === (subNames.length-1));
            CompletionItemDictionary.addClassCompletionItem(parentSubName,childSubName,lastChild)
            if (parentSubName === "%Library") {
                CompletionItemDictionary.addClassCompletionItem('_root','%' + childSubName,true)
            }
        }
    }

    static addClassCompletionItem(parentName,childSubName,lastChild = false,promote = false) {

        // prevent duplications via the items own child array declaration
        let parentPath = (parentName === '_root') ? '' : parentName + '.';
        if (CompletionItemDictionary.clsItems[parentPath + childSubName] !== undefined) return;
        CompletionItemDictionary.clsItems[parentPath + childSubName] = [];

        //make suggestion and push to clsItems
        let suggestion = {insertText: childSubName,label: childSubName}

        if (lastChild) {
            suggestion.kind = 8;
        } else {
            suggestion.insertText += '.';
            suggestion.kind = 5;
        }

        if (promote) suggestion.sortText = '~' + childSubName;

        suggestion.command = {id:'editor.action.triggerSuggest',title:'editor.action.triggerSuggest'};

        CompletionItemDictionary.clsItems[parentName].push( suggestion );

    }

    static getClassStaticMembers(ns,className) {
        let query = `SELECT Name,FormalSpec FROM %Dictionary.CompiledMethod WHERE parent=? AND ClassMethod=1`
        return System.Query(ns,query,[className]).then( results => {
            let suggestions = [];
            results.result.content.map( result => {
                let sortText = ((result.Name.charAt(0) === '%')&&(result.Name !== '%New')) ? ('~' + result.Name) : result.Name;
                let suggestion = { insertText: (result.Name + '('), kind: 5, label: result.Name, sortText: sortText };
                if (result.Name === '%New') suggestion.preselect = true;
                suggestions.push(suggestion)
            })
            return suggestions;
        })
    }

    static getClassMembers(ns,className) {
        let query = `SELECT Name,ReturnType,'5' As Kind FROM %Dictionary.CompiledMethod WHERE parent=? AND ClassMethod=0 and Runnable=1 UNION ALL SELECT Name,RuntimeType,'6' As Kind FROM %Dictionary.CompiledProperty WHERE parent=? UNION ALL SELECT Name,'','13' As Kind FROM %Dictionary.CompiledParameter WHERE parent=?`
        return System.Query(ns,query,[className,className,className]).then( results => {
            let suggestions = [];
            results.result.content.map( result => {
                let sortText = (result.Kind === '13' ? '~~' : '') + (result.Kind === '5' ? '~' : '') + result.Name;
                let label = (result.Kind === '13' ? '#' : '') +  result.Name + (result.Kind === '5' ? '()' : '');
                let suggestion = { insertText: label, kind: +result.Kind, label: label, sortText: sortText };
                if (result.Name === '%New') suggestion.preselect = true;
                suggestions.push(suggestion)
            })
            return suggestions;
        })
    }

    static getThisMembersFromLocalModel(model) {
        let suggestions = [];
        let members = Scanner.scanForClassMembers(model);
        if (members.Method) members.Method.forEach( name => {
            suggestions.push({ insertText: name + '()', kind: 5, label: name + '()' })
        })
        if (members.ClassMethod) members.ClassMethod.forEach( name => {
            suggestions.push({ insertText: name + '()', kind: 11, label: name + '()' })
        })
        if (members.Property) members.Property.forEach( name => {
            suggestions.push({ insertText: name, kind: 6, label: name })
        })
        if (members.Parameter) members.Parameter.forEach( name => {
            suggestions.push({ insertText: '#' + name, kind: 13, label: '#' + name })
        })
        return suggestions;
    }

    static getStaticMethodReturnType(ns,className,methodName) {
        let query = `SELECT ReturnType FROM %Dictionary.CompiledMethod WHERE parent=? and Name=?`
        return System.Query(ns,query,[className,methodName]).then( results => {
            return results.result.content;
        })
    }

}