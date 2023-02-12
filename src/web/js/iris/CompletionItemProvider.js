// register autocompletion provider for ObjectScript
import {CompletionItemDictionary} from "./CompletionItemDictionary.js";
import {AppDirector} from "../AppDirector.js";
import {Scanner} from "./Scanner.js";

class Provider {

    static provideCompletionItems(model, position, context, token) {

        console.log('providing...',context.triggerKind);

        // get text from start of line to position of cursor
        let currentEditLine = model.getValueInRange({startLineNumber: position.lineNumber, startColumn: 0, endLineNumber: position.lineNumber, endColumn: position.column});

        // if in comment or string then skip giving suggestions (single line comment)
        if (Provider.isInCommentOrString(currentEditLine)) return { suggestions: [] };

        //rewind to the trigger character
        let endPosition = currentEditLine.length - 1;
        let c1 = currentEditLine.charAt(endPosition);
        while (c1 !== '(' && c1 !== '.' && c1 !== '#' && c1 !== '$' && c1 !== '^' && c1 !== ' ' && endPosition > 0) {
            endPosition = endPosition - 1;
            c1 = currentEditLine.charAt(endPosition);
        }

        //set range, startColumn must start from trigger character to keep suggesting as typing
        let range = {startLineNumber: position.lineNumber, startColumn: (currentEditLine.lastIndexOf(c1)+2), endLineNumber: position.lineNumber, endColumn: position.column}

        // "As" type
        let spacedTokens = currentEditLine.split(" ");
        if (spacedTokens[spacedTokens.length-2] === "As") {
            let nextName = spacedTokens[spacedTokens.length-1].split('.').pop();
            if ((context.triggerKind === 1) || (nextName === "")) return Provider.getClassNameAsType(currentEditLine,range)
        }

        // ##class name suggestions
        if (/.+##class\([^)]*$/.test(currentEditLine)) return Provider.getClassNameSuggestions(currentEditLine,range)

        // ##class method suggestions
        if (/.+##class\(.+?\)\.$/.test(currentEditLine)) return Provider.getClassStaticMemberSuggestions(currentEditLine,range)

        // ..member of this instance
        if (/.+\.\.$/.test(currentEditLine)) return Provider.getInstanceSuggestions(model,position,range)

        // object.member, n.b. order of this test must be after class method and instance
        if (/.+\.$/.test(currentEditLine)) return Provider.getObjectMemberSuggestions(currentEditLine,model,position,range)

        // intrinsic $
        if (/intrinsic/.test(currentEditLine)) return Provider.notImplemented()

        // extrinsic $$
        if (/extrinsic/.test(currentEditLine)) return Provider.notImplemented()

        // routine $$^
        if (/routine/.test(currentEditLine)) return Provider.notImplemented()

        // macro $$$
        if (/macro/.test(currentEditLine)) return Provider.notImplemented()

        // global ^
        if (/global/.test(currentEditLine)) return Provider.notImplemented()

        // virtual path - GetValueAt / SetValueAt
        if (/vpath/.test(currentEditLine)) return Provider.notImplemented()

        // command
        if (/command/.test(currentEditLine)) return Provider.notImplemented()

        // sql
        if (/sql/.test(currentEditLine)) return Provider.notImplemented()

        //dropped all the way through, suggestions will be an empty array
        return { suggestions: [] };

    }

    //-------------------------------------------------------------------------
    // Returns a list of all possible class names at the class name depth of
    // the cursor. A list of class names was loaded for the explorer on swap to
    // namespace.
    static getClassNameSuggestions(currentEditLine,range) {
        let className = currentEditLine.split('##class(').pop()
        let classNameParts = className.split('.');
        classNameParts.pop();  //last part is always empty in this context, discard it
        if (classNameParts.length === 0) classNameParts.push('_root')
        let path = classNameParts.join('.');
        let suggestions = CompletionItemDictionary.clsItems[path] || [];
        suggestions.map( s => s.range = range )
        return {suggestions: suggestions};
    }

    static getClassStaticMemberSuggestions(currentEditLine,range) {
        let className=currentEditLine.split('##class(').pop().split(')').shift();
        return CompletionItemDictionary.getClassStaticMembers(AppDirector.get('Model.NameSpace'),className).then( suggestions => {
            suggestions.map( s => s.range = range )
            return {suggestions: suggestions};
        });
    }

    static getClassNameAsType(currentEditLine,range) {
        let className = currentEditLine.split('As ').pop()
        let classNameParts = className.split('.');
        classNameParts.pop();  //last part is always empty in this context, discard it
        if (classNameParts.length === 0) classNameParts.push('_root')
        let path = classNameParts.join('.');
        let suggestions = CompletionItemDictionary.clsItems[path] || [];
        suggestions.map( s => s.range = range )
        return {suggestions: suggestions};
    }

    static getInstanceSuggestions(model,position,range) {
        let suggestions = CompletionItemDictionary.getThisMembersFromLocalModel(model);
        suggestions.map ( s => s.range = range)
        return {suggestions: suggestions};
    }

    static getObjectMemberSuggestions(currentEditLine,model,position,range) {
        let tokens = currentEditLine.replace(/[=,(]/," ").split(" ").pop().split('.');
        tokens.pop();
        let vname=tokens.pop();
        let {className,methodName} = Scanner.scanForVariableType(vname,model,position);
        console.log('scanner says',className,methodName);
        if (methodName === '') return {suggestions: []};
        if (methodName !== '%New') {
            CompletionItemDictionary.getStaticMethodReturnType(AppDirector.get('Model.NameSpace'),className,methodName).then( result => {
                console.log(result)
            })
        }
        return CompletionItemDictionary.getClassMembers(AppDirector.get('Model.NameSpace'),className).then( suggestions => {
            suggestions.map( s => s.range = range )
            return {suggestions: suggestions};
        });
    }


    static isInCommentOrString(currentEditLine) {
        let stringParts=currentEditLine.split('"');
        if (stringParts.length % 2 === 0) return true;                  //is in string
        let lastNonString=stringParts.pop()
        if (lastNonString.indexOf('//') > -1) return true;  //is in comment
        if (lastNonString.indexOf('/*') > -1) return true;  //is in multi comment
        return false;
    }

    static notImplemented() {
        return { suggestions: [] };
    }

}

monaco.languages.registerCompletionItemProvider('ObjectScript', {
    triggerCharacters: ['(','.','#','$','^',' '],
    provideCompletionItems: Provider.provideCompletionItems
});


