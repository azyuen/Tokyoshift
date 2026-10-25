// Preview-only storage. Never migrate or delete live-game keys.
for (const kind of ['localStorage','sessionStorage']) {
  const backing = window[kind], prefix = 'tokyoEngineeringPreview:';
  const keys = () => Object.keys(backing).filter(k => k.startsWith(prefix)).map(k => k.slice(prefix.length));
  const api = {
    getItem: k => backing.getItem(prefix + k),
    setItem: (k,v) => backing.setItem(prefix + k,String(v)),
    removeItem: k => backing.removeItem(prefix + k),
    clear: () => keys().forEach(k => backing.removeItem(prefix + k)),
    key: i => keys()[i] ?? null,
    get length() { return keys().length; }
  };
  Object.defineProperty(window,kind,{value:new Proxy(api,{
    get:(o,k)=>k in o?o[k]:o.getItem(k),
    set:(o,k,v)=>{o.setItem(k,v);return true;},
    ownKeys:()=>keys(),
    getOwnPropertyDescriptor:()=>({enumerable:true,configurable:true})
  }),configurable:true});
}
