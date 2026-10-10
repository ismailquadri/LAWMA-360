const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const modules=fs.readFileSync('work/modules.js','utf8');
const base=fs.readFileSync('work/dashboard-v3.js','utf8');
const context=vm.createContext({assert});
vm.runInContext(modules.slice(modules.indexOf('function validateModuleFields('),modules.indexOf('function openForm('))+base.slice(base.indexOf('function csvCell('),base.indexOf('function exportCSV(')),context);
vm.runInContext(`
assert.equal(validateModuleFields([{id:'mass',label:'Mass',type:'number',min:.001,max:100,step:.001}],{mass:'18.456'}),null);
for(const value of ['NaN','Infinity','-1','100001'])assert.ok(validateModuleFields([{id:'capacity',label:'Capacity',type:'number',min:0,max:100000}],{capacity:value}));
assert.ok(validateModuleFields([{id:'capacity',label:'Capacity',type:'number'}],{capacity:'.5'}));
assert.equal(validateModuleFields([{id:'capacity',label:'Capacity',type:'number'}],{capacity:'0'}),null);
assert.equal(validateModuleFields([{id:'p',label:'Partner',options:['new-option']}],{p:'new-option'}),null);
assert.ok(validateModuleFields([{id:'p',label:'Partner',options:['active']}],{p:'inactive'}));
assert.equal(plateKey('LAG-123 AA'),plateKey('lag 123-aa'));
assert.equal(csvCell('ordinary, "value"'), '"ordinary, ""value"""');
for(const value of ['=1+1',' +SUM(A1)','\\t@IMPORT','-2'])assert.ok(csvCell(value).startsWith('"\\\''));
assert.equal(csvCell(42),'"42"');
`,context);
console.log('PASS: finite numbers, bounds, decimal steps, current select options, normalized plates and safe CSV cells.');
