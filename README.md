# Cloud Studio

## Introduction

A work in progress IDE for IRIS.

## Installation

### ZPM Installation

zpm "install cloudstudio"

### Manual Installation

1. Download the project from GitHub and save / unpack the project files into a suitable drive + folder location.

2. Using (classic) "Studio", import CloudStudio.Index.cls into a namespace. You can make a new namespace or import it into an existing namespace.

```
/src/cls/CloudStudio.Index.cls
```

3. Configure a new web application  
  3.1. Using the "Management Portal", create a new web application, name it "/cloudstudio"  
  3.2. Configure the "Physical Path" to point to the sub folder "\src\csp\" at the location in step 1.  
  3.3 Give the application a suitable role  


![Instal Instructions A](./readme/InstructionsA.png)


![Instal Instructions A](./readme/InstructionsB.png)


4. Browse to the index page (replace port number to match your installation setup)

```
http://localhost:52773/cloudstudio/CloudStudio.Index.cls
```

## Roadmap

1. Release a working beta a.s.a.p
2. Make Cloud Studio a stable code editor that is fit for production
3. Continually add new features until it's a complete and battle tested IDE
4. Focus on 10x developer productivity

The project is currently in high flux as it works towards a beta release. There are numerous features that are greyed out / disabled in the app at the moment. These will be completed in the coming weeks.

**A more detailed list of requirements for the Roadmap are listed on the wiki page**

https://github.com/SeanConnelly/CloudStudio/wiki/Requirements
