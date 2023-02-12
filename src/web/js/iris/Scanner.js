export class Scanner {

    static scanForVariableType(vname,model,position) {

        //TODO: use cases that are not yet supported:
        //      %request.content should be %CSP.Stream


        if (vname === '%request') return {className: '%CSP.Request', methodName: '%New'}
        if (vname === '%response') return {className: '%CSP.Response', methodName: '%New'}
        if (vname === '%session') return {className: '%CSP.Session', methodName: '%New'}

        let re=/[Ss][Ee]?[Tt]? ([\^%\w]+?)? *= *##class\((.+?)\)\.(.+?)\(/g

        let lineNo = position.lineNumber;
        let line = '';
        let str = line;
        while ((line.substring(0, 11) !== "ClassMethod") && (line.substring(0, 6) !== "Method") && (lineNo>1)) {
            lineNo--;
            line = '';
            model.getLineContent(lineNo).split('"').map( (src,index) => {
                if (index === 1) line += '\n';
                if (index % 2 === 0) line += src;
            });
            str += line;
        }

        let match;
        do {
            match = re.exec(str);
            if (match) {
                if (match[1] === vname) return { className: match[2], methodName: match[3]}
            }
        } while (match);

        let className=''
        let args = line.split('(')[1].split(')')[0].split(',');
        args.forEach( arg => {
            let [argName,argType] = arg.split(' As ');
            if (vname === argName.trim() && argType) className = argType.trim();
        })

        return {className: className, methodName: ''}
    }

    //very simple member scanner, used to augment new member to a classes own member list fetched from the server
    static scanForClassMembers(model) {
        let members = {};
        let re = /^(Method .+?\(|Parameter .+?=|Property .+? )/g;
        model.getLinesContent().forEach( line => {
            if (line.charAt(0) === " ") return;
            if (line.charAt(0) === "\t") return;
            line = line.replace("("," ");
            let [type,name] = line.split(" ");
            if (members[type] === undefined) members[type] = [];
            members[type].push(name);
        })
        return members;
    }

}