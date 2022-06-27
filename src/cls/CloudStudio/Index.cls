Class CloudStudio.Index Extends %CSP.Page
{

ClassMethod OnPage() As %Status [ ServerOnly = 1 ]
{
	&html<
	
	<!DOCTYPE html>
	<html lang="en">
	<head>
	    <meta charset="UTF-8">
	    <title>Cloud Studio</title>
	    
	    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css" rel="stylesheet">
	    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/js/all.min.js"></script>

		<link rel="stylesheet" data-name="vs/editor/editor.main" href="./lib/vs/editor/editor.main.css" />
		
		<link rel="icon" href="favicon.png">

	    <link rel="stylesheet" href="./style/reset.css">
	    <link rel="stylesheet" href="./style/vars.css">
	    <link rel="stylesheet" href="./style/utils.css">
	    <link rel="stylesheet" href="./style/layout.css">
	    <link rel="stylesheet" href="./style/menu.css">
	    <link rel="stylesheet" href="./style/explorer.css">
	    <link rel="stylesheet" href="./style/editor.css">
	    <link rel="stylesheet" href="./style/tablayout.css">	    
	        
	</head>
	<body>

	<div class="viewport hidden">

		<!-- top menu -->
		#(..TopMenu())#

		<!-- explorer -->
		#(..Explorer())#
		
		<!-- explorer dragbar -->
		<div onmousedown="CloudStudioDirector.request('Action.ExplorerDragbar','start')" class="explorer-dragbar" id="explorerDragbar"></div>
		
		<!-- editors -->
		<div class="editors" id="editSpaceContainer">
			<div class="pad-1em" style="color:#777">Initialising...</div>
		</div>
	    
	    <!-- output windows -->
		<div class="status-window" id="statusWindow" data-state='closed'>

			<!-- output dragbar -->
			<div onmousedown="CloudStudioDirector.request('Action.OutputDragbar','start')" class="output-dragbar" id="outputDragbar"></div>
		
			<!-- status bar -->
			<div class="status-bar flex-row" id="statusBar">
				<div class="flex-1 flex-row status-bar-tabs">
					<button onclick="CloudStudioDirector.request('Action.StatusWindow','output',false,true)" class="status-bar-button">Output</button>
					<!-- <button onclick="CloudStudioDirector.request('Action.StatusWindow','terminal',false,true)" class="status-bar-button">Terminal</button> -->
					<!-- <button onclick="CloudStudioDirector.request('Action.StatusWindow','results')" class="status-bar-button">Results</button> -->
				</div>
				<div class="flex-1 flex-row status-bar-status">
					<span id="CursorPosition">0:0</span>
				</div>
				<div class="flex-1 flex-row status-bar-info">
					<div class="float-right">
						<!-- MINIMISE / PIN -->
					</div>
				</div>
			</div>
			
			<div class="output-window" id="outputWindow">
			</div>

			<!--
			<div class="terminal-window" id="terminalWindow">				
			</div>			
			-->
		
		</div>
		
		  
	</div>

	</body>


	<script language="javascript">
	var require = { paths: { vs: './lib/vs' } };
   </script>
	<script src="./lib/vs/loader.js"></script>
	<script src="./lib/vs/editor/editor.main.nls.js"></script>
	<script src="./lib/vs/editor/editor.main.js"></script>
	
	<script type="module" src="./main.js"></script>

		 
	<script language="javascript">
		#(..InitialiseAppData())#
	</script>
	</html>
	
	>
	quit $$$OK
}

/// TODO: Quick hack, move into an API
ClassMethod InitialiseAppData()
{
	
	//user name
	write !,"CloudStudioAppDefault = {};"
	write !,"CloudStudioAppDefault.User='",$USERNAME,"';"
	
	//default namespace
	set thisNamespace=$NAMESPACE
	zn "%SYS"
	set user=##class(Security.Users).%OpenId($USERNAME)
	set defaultNamespace=user.NameSpace
	if defaultNamespace="" set defaultNamespace=thisNamespace
	zn thisNamespace
	write !,"CloudStudioAppDefault.NS='",defaultNamespace,"';"
	
	quit ""
}

ClassMethod TopMenu() As %Status
{
	&html<
	
	<div class="menu-bar flex-row" id="top-menu">
	
	<div class="flex-row flex-1">
	
		<button class="rel menu-top-button" id="kebab-menu" onclick="CloudStudioDirector.set('Action.MinimiseExplorer','',false,true)">
			<i class="fa-solid fa-bars" style="margin-top: 0.15em;"></i>
		</button>
		
		<button class="rel menu-top-button" id="file-menu">File
		  <div class="sub-menu menu-below">
		  
  		    <div class="rel">Change Namespace
		    	<span class="float-right"><i class="fas fa-angle-right"></i></span>	    	
			    <div class="sub-menu menu-aside">
					<%=..OutputNamespaces()%>
			    </div>	
		    </div>
		    		    
			<div class="menu-divide"></div>
		  
		    <div class="rel">New Class
		    	<span class="float-right"><i class="fas fa-angle-right"></i></span>
			    <div class="sub-menu menu-aside">
			    	<div onclick="CloudStudioDirector.set('Action.New','Registered',false,true)">Registered</div>
			    	<div onclick="CloudStudioDirector.set('Action.New','Persistent',false,true)">Persistent</div>
			    	<div class="menu-divide"></div>
			    	<div onclick="CloudStudioDirector.set('Action.New','Registered XML',false,true)">Registered + XML</div>
			    	<div onclick="CloudStudioDirector.set('Action.New','Persistent XML',false,true)">Persistent + XML</div>			    	
			    	<div class="menu-divide"></div>
			    	<div onclick="CloudStudioDirector.set('Action.New','Serial',false,true)">Serial</div>
			    	<div onclick="CloudStudioDirector.set('Action.New','Abstract',false,true)">Abstract</div>
			    	<div class="menu-divide"></div>
			    	<div onclick="CloudStudioDirector.set('Action.New','CSP',false,true)">CSP Class</div>
			    	<div class="disabled" onclick="CloudStudioDirector.set('Action.New','',false,true)">Web Service</div>
			    </div>	
		    </div>
		    
		    <div class="rel">New Routine
		    	<span class="float-right"><i class="fas fa-angle-right"></i></span>
			    <div class="sub-menu menu-aside">
			    	<div onclick="CloudStudioDirector.set('Action.New','Routine',false,true)">ObjectScript</div>
			    	<div class="menu-divide"></div>
			    	<div class="disabled" onclick="CloudStudioDirector.set('Action.New','',false,true)">Basic</div>
			    	<div class="disabled" onclick="CloudStudioDirector.set('Action.New','',false,true)">MultiValue</div>
			    	<div class="menu-divide"></div>			    	
			    	<div onclick="CloudStudioDirector.set('Action.New','Macro',false,true)">Macro Include</div>
			    	<div onclick="CloudStudioDirector.set('Action.New','Intermediary',false,true)">Intermediary</div>			    	
			    </div>	
		    </div>
		    
		   <div class="rel">New Web File
		    	<span class="float-right"><i class="fas fa-angle-right"></i></span>
			    <div class="sub-menu menu-aside">
			    	<div class="disabled" onclick="CloudStudioDirector.set('Action.New','',false,true)">CSP Page</div>
			    	<div class="menu-divide"></div>
			    	<div class="disabled" onclick="CloudStudioDirector.set('Action.New','',false,true)">JavaScript</div>
			    	<div class="disabled" onclick="CloudStudioDirector.set('Action.New','',false,true)">TypeScript</div>
			    	<div class="menu-divide"></div>			    	
			    	<div class="disabled" onclick="CloudStudioDirector.set('Action.New','',false,true)">CSS</div>
			    	<div class="disabled" onclick="CloudStudioDirector.set('Action.New','',false,true)">HTML</div>			    	
			    </div>	
		    </div>

		   <div class="rel">New Production
		    	<span class="float-right"><i class="fas fa-angle-right"></i></span>
			    <div class="sub-menu menu-aside">
			    	<div class="disabled" onclick="CloudStudioDirector.set('Action.New','',false,true)">Service</div>
			    	<div class="disabled" onclick="CloudStudioDirector.set('Action.New','',false,true)">Service Adapter</div>			    	
			    	<div class="menu-divide"></div>
			    	<div class="disabled" onclick="CloudStudioDirector.set('Action.New','',false,true)">Message</div>
			    	<div class="disabled" onclick="CloudStudioDirector.set('Action.New','',false,true)">BPL Process</div>
			    	<div class="disabled" onclick="CloudStudioDirector.set('Action.New','',false,true)">Custom Process</div>
			    	<div class="disabled" onclick="CloudStudioDirector.set('Action.New','',false,true)">DTL Transformation</div>			    	
			    	<div class="menu-divide"></div>			    	
			    	<div class="disabled" onclick="CloudStudioDirector.set('Action.New','',false,true)">Operation</div>
			    	<div class="disabled" onclick="CloudStudioDirector.set('Action.New','',false,true)">Operation Adapter</div>			    	
			    	<div class="menu-divide"></div>			    	
			    	<div class="disabled" onclick="CloudStudioDirector.set('Action.New','',false,true)">Production</div>
			    </div>	
		    </div>

		   <div class="rel">New Custom
		    	<span class="float-right"><i class="fas fa-angle-right"></i></span>
			    <div class="sub-menu menu-aside">
			    	<div class="disabled" onclick="CloudStudioDirector.set('Action.New','',false,true)">Unit Test</div>
			    	<div class="disabled" onclick="CloudStudioDirector.set('Action.New','',false,true)">ZPM Package</div>
			    	<div class="disabled" onclick="CloudStudioDirector.set('Action.New','',false,true)">DeepSee KPI</div>			    	
			    	<div class="menu-divide"></div>
			    	<div class="disabled" onclick="CloudStudioDirector.set('Action.New','',false,true)">Custom Defintion</div>
			    </div>	
		    </div>

		    <div class="menu-divide"></div>
		    <div onclick="CloudStudioDirector.set('Action.Save')">Save</div>
		    <div onclick="CloudStudioDirector.set('Action.SaveAll')">Save All</div>
		    <div class="disabled">Save As...</div>
		    <div class="disabled">Save Copy As...</div>
		    <div class="disabled">Rename...</div>
    		<div class="disabled">Autosave</div>
    		    
		    <div class="menu-divide"></div>
			
			<div class="disabled">Print</div>
			
		  </div>
		</button>
		
		<button class="rel menu-top-button" id="edit-menu">Edit
		  <div class="sub-menu menu-below">
		    <div onclick="CloudStudioDirector.set('Action.Undu','',false,true)">Undu</div>
		    <div onclick="CloudStudioDirector.set('Action.Redo','',false,true)">Redo</div>
		    <div class="menu-divide"></div>
		    <div onclick="CloudStudioDirector.set('Action.Cut','',false,true)">Cut</div>
		    <div onclick="CloudStudioDirector.set('Action.Copy','',false,true)">Copy</div> 
		    <div onclick="CloudStudioDirector.set('Action.Paste','',false,true)">Paste</div>
		    <div class="disabled">Delete</div>
		    <div class="menu-divide"></div>        
		    <div onclick="CloudStudioDirector.set('Action.SelectAll','',false,true)">Select All</div>
		    <div class="menu-divide"></div>        
		    <div class="disabled">Find...</div>
		    <div class="disabled">Replace...</div>
		    <div class="menu-divide"></div>
		    <div class="disabled">Search in Files...</div>		    
		  </div>
		</button>
		
		<button class="rel menu-top-button" id="view-menu">View
     	 <div class="sub-menu menu-below">
		    <div onclick="CloudStudioDirector.request('Action.ToggleFullScreen','',false,true)">Full Screen</div>
		    <div class="rel">Text Size
			    <span class="float-right"><i class="fas fa-angle-right"></i></span>
			    <div class="sub-menu menu-aside">
				    <div onclick="CloudStudioDirector.set('Action.TextSize','Small')">Small</div>
			    	<div onclick="CloudStudioDirector.set('Action.TextSize','Normal')">Normal</div>
			    	<div onclick="CloudStudioDirector.set('Action.TextSize','Large')">Large</div>
			    	<div onclick="CloudStudioDirector.set('Action.TextSize','ExtraLarge')">Extra Large</div>
			    </div>		    
		    </div>
		    <div class="menu-divide"></div>
		    <div onclick="CloudStudioDirector.set('Action.ShowLineNumbers','toggle',false,true)">Show Line Numbers</div>
		    <div onclick="CloudStudioDirector.set('Action.ShowMiniMap','toggle',false,true)">Show Mini Map</div>
   		    <div class="menu-divide"></div>
   		    <div class="rel">Appearance
		    	<span class="float-right"><i class="fas fa-angle-right"></i></span>
			    <div class="sub-menu menu-aside">
			    	<div onclick="CloudStudioDirector.set('Model.Appearance','light',false,true)">Light</div>
			    	<div onclick="CloudStudioDirector.set('Model.Appearance','dark',false,true)">Dark</div>
			    </div>	
		    </div>
   		    <div class="rel">Accent Color
		    	<span class="float-right"><i class="fas fa-angle-right"></i></span>
			    <div class="sub-menu menu-aside">
			    	<div onclick="CloudStudioDirector.set('Model.AccentColor','red',false,true)"><span class="menu-view--color bg-red">&nbsp;</span>Red</div>
			    	<div onclick="CloudStudioDirector.set('Model.AccentColor','brown',false,true)"><span class="menu-view--color bg-brown">&nbsp;</span>Brown</div>
			    	<div onclick="CloudStudioDirector.set('Model.AccentColor','orange',false,true)"><span class="menu-view--color bg-orange">&nbsp;</span>Orange</div>
			    	<div onclick="CloudStudioDirector.set('Model.AccentColor','yellow',false,true)"><span class="menu-view--color bg-yellow">&nbsp;</span>Yellow</div>
			    	<div onclick="CloudStudioDirector.set('Model.AccentColor','green',false,true)"><span class="menu-view--color bg-green">&nbsp;</span>Green</div>
			    	<div onclick="CloudStudioDirector.set('Model.AccentColor','mint',false,true)"><span class="menu-view--color bg-mint">&nbsp;</span>Mint</div>
			    	<div onclick="CloudStudioDirector.set('Model.AccentColor','cyan',false,true)"><span class="menu-view--color bg-cyan">&nbsp;</span>Cyan</div>
			    	<div onclick="CloudStudioDirector.set('Model.AccentColor','blue',false,true)"><span class="menu-view--color bg-blue">&nbsp;</span>Blue</div>
			    	<div onclick="CloudStudioDirector.set('Model.AccentColor','magenta',false,true)"><span class="menu-view--color bg-magenta">&nbsp;</span>Magenta</div>
			    </div>	
		    </div>
		    <div class="menu-divide"></div>
		    <div onclick="CloudStudioDirector.request('Action.ReloadPage','',false,true)">Reload</div>
		    <div onclick="CloudStudioDirector.request('Action.ResetPage','',false,true)">Reset</div>
		    <div class="menu-divide"></div>
		    <div class="disabled" onclick="CloudStudioDirector.request('Action.ViewOtherCode','',false,true)">View Other Code</div>
		    <div class="menu-divide"></div>
		    <div class="rel">Fold
		    	<span class="float-right"><i class="fas fa-angle-right"></i></span>
			    <div class="sub-menu menu-aside">
			    	<div onclick="CloudStudioDirector.set('Action.FoldLevel','1',false,true)">Level 1</div>
			    	<div onclick="CloudStudioDirector.set('Action.FoldLevel','2',false,true)">Level 2</div>
			    	<div onclick="CloudStudioDirector.set('Action.FoldLevel','3',false,true)">Level 3</div>
			    	<div onclick="CloudStudioDirector.set('Action.FoldLevel','4',false,true)">Level 4</div>			    				    	
			    	<div onclick="CloudStudioDirector.set('Action.FoldLevel','5',false,true)">Level 5</div>
			    	<div onclick="CloudStudioDirector.set('Action.FoldLevel','6',false,true)">Level 6</div>
			    	<div onclick="CloudStudioDirector.set('Action.FoldLevel','7',false,true)">Level 7</div>
			    </div>	
		    </div>
		    <div onclick="CloudStudioDirector.request('Action.FoldAll','',false,true)">Fold All Code</div>
		    <div onclick="CloudStudioDirector.request('Action.UnfoldAll','',false,true)">Unfold All Code</div>
	     </div>
		</button>

		<button class="rel menu-top-button" id="project-menu">Project
		 <div class="sub-menu menu-below">
		    <div class="disabled">Manage Project</div>
		    <div class="disabled">Baseline Project</div>
		    <div class="menu-divide"></div>
		    <div class="disabled">Export Project</div>
		    <div class="menu-divide"></div>
		    <div class="disabled">Open Project</div>
		    <div class="disabled">New Project</div>
		    <div class="disabled">Rename Project</div>
		    <div class="disabled">Copy Project</div>		    
		    <div class="disabled">Close Project</div>
	     </div>
		</button>
				
		<button class="rel menu-top-button" id="edit-menu">Build
		  <div class="sub-menu menu-below">
		    <div onclick="CloudStudioDirector.request('Action.Compile','',false,true)">Compile</div>
		    <div class="menu-divide"></div>
		    <div  onclick="CloudStudioDirector.request('Action.CompileAllOpen','',false,true)">Compile All Open</div>
		  </div>
		</button>
		
		<button class="rel menu-top-button" id="tools-menu">Tools</button>
		
	</div>
	<div class="flex-row">
		<button onclick="CloudStudioDirector.request('Action.Save','',false,true)" class="rel icon-button" id="tools-menu"><i class="fas fa-save fa-sm"></i></button>
		<button onclick="CloudStudioDirector.request('Action.Compile','',false,true)" class="rel icon-button" id="tools-menu"><i class="fas fa-cogs fa-sm"></i></button>
	</div>
	<div class="flex-row flex-1">	
		<button class="rel menu-top-button push-right" id="utils-menu">Utilities
			<div class="sub-menu menu-below-right">
		     <div onclick="CloudStudioDirector.request('Action.LaunchUtility','Management Portal',false,true)">Management Portal</div>
		     <div onclick="CloudStudioDirector.request('Action.LaunchUtility','SQL Explorer',false,true)">SQL Explorer</div>    		     		     
		     <div class="menu-divide"></div>
		     <div onclick="CloudStudioDirector.request('Action.LaunchUtility','Class Reference',false,true)">Class Reference</div>    		     		     		     
		     <div class="menu-divide"></div>    
		     <div onclick="CloudStudioDirector.request('Action.LaunchUtility','Production Configuration',false,true)">Production Configuration</div>
		     <div onclick="CloudStudioDirector.request('Action.LaunchUtility','Production Monitor',false,true)">Production Monitor</div>
		     <div onclick="CloudStudioDirector.request('Action.LaunchUtility','System Monitor',false,true)">System Monitor</div>
		     <div onclick="CloudStudioDirector.request('Action.LaunchUtility','Message Viewer',false,true)">Message Viewer</div>
		     <div class="menu-divide"></div> 
		     <div onclick="CloudStudioDirector.request('Action.LaunchUtility','Web Terminal',false,true)">Web Terminal</div>     
		  </div>
		</button>
		<button class="rel menu-top-button" id="help-menu">Help
		  <div class="sub-menu menu-below-right">
		     <div onclick="CloudStudioDirector.request('Action.LaunchHelp','InterSystems Documentation',false,true)">InterSystems Documentation</div>
		     <div onclick="CloudStudioDirector.request('Action.LaunchHelp','InterSystems Community',false,true)">InterSystems Community</div>
		     <div onclick="CloudStudioDirector.request('Action.LaunchHelp','InterSystems Discord',false,true)">InterSystems Discord</div>
		     <div class="menu-divide"></div>
		     <div onclick="CloudStudioDirector.request('Action.LaunchHelp','CloudStudio GitHub',false,true)">CloudStudio GitHub</div>    		     		     
		     <div onclick="CloudStudioDirector.request('Action.LaunchHelp','CloudStudio Discord',false,true)">CloudStudio Discord</div>
		  </div>
		</button>
		</button>
	</div>	
	</div>
	
	>
	quit ""
}

ClassMethod OutputNamespaces()
{
	set sc=##class(%SYS.Namespace).ListAll(.nsl)
	set ns=$o(nsl(""))
	while ns'="" {
		if $e(ns)'="^" write "<div onclick=""CloudStudioDirector.set('Action.SwapNamespace','"_ns_"',false,true)"">"_ns_"</div>"
		set ns=$o(nsl(ns))
	}
	quit ""
}

ClassMethod Explorer() As %Status
{
	
	&html<
	
	<div class="explorer flex-col" data-state="open" id="explorerPanel">
		<div class="explorer-title flex-row">
	  		<span id="namespace"></span>
	  		<button class="flex-right menu-top-button rel" id="file-menu">
	  		  <i class="fa-solid fa-ellipsis-vertical"></i>
	          <div class="sub-menu menu-below-right">
	            <div onclick="CloudStudioDirector.request('Action.ExpandAll','',false,true)" id="">Expand All</div>
	            <div onclick="CloudStudioDirector.request('Action.CollapseAll','',false,true)" id="">Collapse All</div>
	          </div>
	        </button>
		</div>
		<div class="flex-grow code-tree" id="explorer-tree"></div>
	</div>
	
	>
	quit ""
}

}

