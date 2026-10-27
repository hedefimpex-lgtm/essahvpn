const fs=require('node:fs/promises');const path=require('node:path');
module.exports=async context=>{
 const files=[],dirs=[];
 async function scan(relative){for(const e of await fs.readdir(path.join(context.appOutDir,relative),{withFileTypes:true})){const name=path.join(relative,e.name);if(e.isDirectory()){await scan(name);dirs.push(name);}else files.push(name);}}
 await scan('');
 const escaped=name=>name.replaceAll('\\','/').replaceAll('$','$$').replaceAll('"','$\\"');
 const lines=files.map(name=>'Delete "$INSTDIR/'+escaped(name)+'"');
 lines.push(...dirs.map(name=>'RMDir "$INSTDIR/'+escaped(name)+'"'));
 await fs.writeFile(path.join(context.packager.projectDir,'build','generated-uninstall.nsh'),lines.join('\n')+'\n');
};
