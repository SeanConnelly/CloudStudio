export class IrisSystem {

    query(ns,queryString,parameters) {
        return fetch(`/api/atelier/v1/${encodeURI(ns)}/action/query`,{
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: queryString,
                parameters: parameters
            })
        })
    }

}

