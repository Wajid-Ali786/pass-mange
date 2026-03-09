function exportBackup(){

let data={
sites,
historyLog
};

let blob=new Blob([JSON.stringify(data)]);

let a=document.createElement("a");

a.href=URL.createObjectURL(blob);

a.download="password-backup.json";

a.click();

toast("Backup exported");

}

document.getElementById("importFile").addEventListener("change",e=>{

let file=e.target.files[0];

let reader=new FileReader();

reader.onload=function(){

let data=JSON.parse(reader.result);

sites=data.sites||[];

historyLog=data.historyLog||[];

saveData();

location.reload();

};

reader.readAsText(file);

});