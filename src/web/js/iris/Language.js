monaco.languages.register({id: 'ObjectScript'});

monaco.languages.setMonarchTokensProvider('ObjectScript', {

    ignoreCase: true,

    classwords: [
        'As','Include','IncludeGenerator','Class','ClassMethod','Extends', 'Parameter', 'Index', 'Property', 'Method', 'XData'
    ],

    keywords: [
        'break','b ','continue','close','c ','do','d ','else','e ','for','f ',
        'goto','g ','halt','h ','hang','i ','if','job','j ','kill','k ',
        'merge','m ','new','n ','open','o ','quit','q ',
        'read','r ','return','ret','set','s ',
        'tstart','ts','tcommit','tc','trollback','tro','throw',
        'use','u ','view','v ','write','w ','xecute','x ',
        'zkill','zl','znspace','zn','ztrap','zwrite','zw','zzdump','zzwrite','#dim'
    ],

    functions: [
        ''
    ],

    typeKeywords: [
        '%string', '%integer'
    ],

    operators: [
        "+","-","*","/","\\","**","#",
        "_","'",",",":","^",
        "=","'=",">","'>","<=","<","'<",">=",
        "[","]","]]",
        "&","&&","!","||","@","?"
    ],

    symbols:  /[\^\:\,\+\-\*\/\\\*\#\_\'\=\>\<\]\[\&\!\|\@\?]{1}/,

    tokenizer: {

        root: [
            { include:             '@whitespace' 	},
            { include:             'common'      	},
            [ /"((?:""|[^"])*)"/,  'string'			],
            [ /[{}()\[\]]/,        'delimiter'      ],
            [ /@symbols/,          { cases:      { '@operators': 'operator', '@default'  : '' } } ],
        ],

        common: [

            [/##class/,'keyword'],

            [/[A-Za-z%][\w$]*/, {
                cases: {
                    '@classwords': 'keyword',
                    '@keywords': 'keyword',
                    '@typeKeywords': 'keyword'
                }
            }],

            //$$$MACROS
            [/\${3}[a-z0-9]+/,'keyword'],

            //..MEMBERS
            [/\.{2}#?[a-z%][a-z0-9]*/,'type'],

            //$INTRINSIC FUNCTIONS
            [/\$[a-z]+/,'tag']

        ],

        whitespace: [
            [/[ \t\r\n]+/, ''],
            [/\/\*/, 'comment', '@mlcomment'],
            [/\/\/.*$/, 'comment'],
            [/;.*$/, 'comment'],
            [/#;.*$/, 'comment']
        ],

        mlcomment: [
            [/[^\/*]+/, 'comment'],
            [/\*\//, 'comment', '@pop'],
            [/[\/*]/, 'comment'],
        ]

    }

})
















