const providers = {
 openai: {url:'https://api.openai.com/v1/chat/completions', model:'gpt-4.1-mini'},
 anthropic: {url:'https://api.anthropic.com/v1/messages', model:'claude-sonnet-4-20250514'},
 gemini: {url:'https://generativelanguage.googleapis.com/v1beta/models/', model:'gemini-2.5-flash'}
};
function request(provider, key, model, prompt) {
 if (!providers[provider]) throw Error('Sağlayıcı desteklenmiyor. OpenCode bir model sağlayıcısı değildir.');
 if (!key || !prompt.trim()) throw Error('API anahtarı ve mesaj gerekli.');
 model = model.trim() || providers[provider].model;
 if (!/^[a-zA-Z0-9._:-]+$/.test(model)) throw Error('Model adı geçersiz.');
 const headers={'Content-Type':'application/json'};
 if(provider==='anthropic') return {url:providers[provider].url,headers:{...headers,'x-api-key':key,'anthropic-version':'2023-06-01'},body:{model,max_tokens:2048,messages:[{role:'user',content:prompt}]}};
 if(provider==='gemini') return {url:providers[provider].url+encodeURIComponent(model)+':generateContent',headers:{...headers,'x-goog-api-key':key},body:{contents:[{parts:[{text:prompt}]}]}};
 return {url:providers[provider].url,headers:{...headers,Authorization:'Bearer '+key},body:{model,messages:[{role:'user',content:prompt}]}};
}
function answer(provider,data) {
 if(provider==='anthropic') return data.content?.filter(x=>x.type==='text').map(x=>x.text).join('\n');
 if(provider==='gemini') return data.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('\n');
 return data.choices?.[0]?.message?.content;
}
module.exports={providers,request,answer};
