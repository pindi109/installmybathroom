(function(){
  "use strict";
  var WELCOME="Hi, I'm Amy, the Install My Bathroom assistant. Ask me about services, pricing, areas we cover or the £125 survey — or tell me about your project and I'll point you the right way.";
  var OPENED_KEY="imbChatOpened";
  var messages=[];
  var opened=false;
  var bounceTimer=null,bounceInterval=null;

  function el(tag,attrs,html){
    var e=document.createElement(tag);
    if(attrs)for(var k in attrs)e.setAttribute(k,attrs[k]);
    if(html!=null)e.innerHTML=html;
    return e;
  }

  function build(){
    var bubble=el("button",{id:"imb-chat-bubble","aria-label":"Chat with Amy from Install My Bathroom",type:"button"},"<span>Amy</span>");

    var overlay=el("div",{id:"imb-chat-overlay",role:"dialog","aria-modal":"true","aria-label":"Chat with Amy"});
    var modal=el("div",{id:"imb-chat-modal"});

    var header=el("div",{id:"imb-chat-header"});
    var headerText=el("div",{id:"imb-chat-header-text"},"<strong>Amy</strong><span>Typically replies instantly</span>");
    header.appendChild(headerText);
    var detailsBtn=el("button",{id:"imb-chat-details-btn",type:"button","aria-label":"Leave your details"},"Leave details");
    header.appendChild(detailsBtn);
    var closeBtn=el("button",{id:"imb-chat-close",type:"button","aria-label":"Close chat"},"&times;");
    header.appendChild(closeBtn);

    var messagesEl=el("div",{id:"imb-chat-messages"});

    var leadForm=el("form",{id:"imb-chat-lead-form","class":"imb-hidden"});
    leadForm.appendChild(el("input",{id:"imb-chat-lead-name",type:"text",placeholder:"Name",autocomplete:"name",required:"required"}));
    leadForm.appendChild(el("input",{id:"imb-chat-lead-email",type:"email",placeholder:"Email",autocomplete:"email",required:"required"}));
    leadForm.appendChild(el("input",{id:"imb-chat-lead-phone",type:"tel",placeholder:"Phone",autocomplete:"tel"}));
    var leadSubmit=el("button",{type:"submit"},"Send my details");
    leadForm.appendChild(leadSubmit);

    var form=el("form",{id:"imb-chat-form"});
    var input=el("input",{id:"imb-chat-input",type:"text",placeholder:"Type a message…","aria-label":"Message",autocomplete:"off"});
    var sendBtn=el("button",{id:"imb-chat-send",type:"submit"},"Send");
    form.appendChild(input);form.appendChild(sendBtn);

    modal.appendChild(header);modal.appendChild(messagesEl);modal.appendChild(leadForm);modal.appendChild(form);
    overlay.appendChild(modal);
    document.body.appendChild(bubble);
    document.body.appendChild(overlay);

    bubble.addEventListener("click",openChat);
    closeBtn.addEventListener("click",closeChat);
    overlay.addEventListener("click",function(e){if(e.target===overlay)closeChat();});
    document.addEventListener("keydown",function(e){if(e.key==="Escape"&&overlay.classList.contains("imb-open"))closeChat();});
    form.addEventListener("submit",function(e){e.preventDefault();sendMessage();});
    detailsBtn.addEventListener("click",function(){leadForm.classList.toggle("imb-hidden");});
    leadForm.addEventListener("submit",function(e){e.preventDefault();sendLead();});

    return {bubble:bubble,overlay:overlay,messagesEl:messagesEl,input:input,sendBtn:sendBtn,leadForm:leadForm};
  }

  var ui;

  function addBubble(role,text){
    var b=el("div",{"class":"imb-msg "+(role==="user"?"imb-msg-user":"imb-msg-agent")});
    b.textContent=text;
    ui.messagesEl.appendChild(b);
    ui.messagesEl.scrollTop=ui.messagesEl.scrollHeight;
    return b;
  }

  function showTyping(){
    var t=el("div",{id:"imb-chat-typing","class":"imb-typing"},"<span></span><span></span><span></span>");
    ui.messagesEl.appendChild(t);
    ui.messagesEl.scrollTop=ui.messagesEl.scrollHeight;
    return t;
  }

  function sendMessage(){
    var text=ui.input.value.trim();
    if(!text)return;
    messages.push({role:"user",content:text});
    addBubble("user",text);
    ui.input.value="";
    ui.input.disabled=true;ui.sendBtn.disabled=true;
    var typing=showTyping();

    fetch("/.netlify/functions/chat",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({messages:messages})
    }).then(function(r){return r.json();}).then(function(data){
      typing.remove();
      var reply=(data&&data.reply)||"Sorry, I couldn't quite get that — please try again, or call us on 07399 651836.";
      messages.push({role:"assistant",content:reply});
      addBubble("agent",reply);
    }).catch(function(){
      typing.remove();
      addBubble("agent","Sorry, something went wrong on our end — please try again, or call us on 07399 651836.");
    }).finally(function(){
      ui.input.disabled=false;ui.sendBtn.disabled=false;ui.input.focus();
    });
  }

  function sendLead(){
    var name=document.getElementById("imb-chat-lead-name").value.trim();
    var email=document.getElementById("imb-chat-lead-email").value.trim();
    var phone=document.getElementById("imb-chat-lead-phone").value.trim();
    if(!name||!email)return;
    fetch("/.netlify/functions/chat",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({messages:[],lead:{name:name,email:email,phone:phone,message:"Submitted via Amy chat widget."}})
    }).finally(function(){
      ui.leadForm.classList.add("imb-hidden");
      addBubble("agent","Thanks "+name+" — we've got your details and will be in touch shortly.");
    });
  }

  function stopBounce(){
    if(bounceTimer)clearTimeout(bounceTimer);
    if(bounceInterval)clearInterval(bounceInterval);
    ui.bubble.classList.remove("imb-bounce");
  }

  function openChat(){
    ui.overlay.classList.add("imb-open");
    if(!opened){
      opened=true;
      try{sessionStorage.setItem(OPENED_KEY,"1");}catch(e){}
      stopBounce();
      addBubble("agent",WELCOME);
      messages.push({role:"assistant",content:WELCOME});
    }
    setTimeout(function(){ui.input.focus();},160);
  }

  function closeChat(){
    ui.overlay.classList.remove("imb-open");
  }

  function initBounce(){
    var already=false;
    try{already=sessionStorage.getItem(OPENED_KEY)==="1";}catch(e){}
    if(already){opened=true;return;}
    function bounceOnce(){
      ui.bubble.classList.add("imb-bounce");
      setTimeout(function(){ui.bubble.classList.remove("imb-bounce");},650);
    }
    bounceTimer=setTimeout(function(){
      bounceOnce();
      bounceInterval=setInterval(bounceOnce,20000);
    },3000);
  }

  function init(){
    ui=build();
    initBounce();
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",init);
  }else{
    init();
  }
})();
