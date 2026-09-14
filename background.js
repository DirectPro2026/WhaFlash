async function h(e) {
  try {
    const t = await chrome.tabs.query({ url: e });
    if (t.length === 0)
      return;
    const a = t.map((o) => o.id);
    await chrome.tabs.remove(a);
  } catch (t) {
    console.error("Erro ao tentar fechar as abas do WhatsApp:", t);
  }
}
function E(e) {
  const t = new Date(e), a = /* @__PURE__ */ new Date(), o = t.getTime() - a.getTime();
  return o <= 12e4 || o < 0;
}
const c = {
  // NomeID Da WL Ativa
  name: "watidy",
  // Versão de build
  version: "7.4.3.81",
  // Chave de criptografia
  cript_key: "ffce211a-7b07-4d91-ba5d-c40bb4034a83",
  // Url do backend principal
  backend_plugin: "https://backend-plugin.wascript.com.br/",
  // Url do backend Antigo
  backend: "https://painel-old.wascript.com.br/",
  // Url do backend de funções auxiliares
  backend_utils: "https://backend-utils.wascript.com.br/",
  // WebSockets
  webSocket: {
    "multi-atendimento": "https://new-multi-atendimento.wascript.com.br",
    "api-whatsapp": "https://api-whatsapp.wascript.com.br"
  },
  // Url do painel de clientes
  painel_cliente: "https://app.wascript.com.br",
  // Url do audio transcriber
  audio_transcriber: "https://audio-transcriber.wascript.com.br/transcription",
  // Url do código remoto
  remote_code: "https://code.wascript.com.br/",
  //remote_code: "https://dev.watools.com.br/",
  // Url das Config Externa
  config_externa: "https://code.wascript.com.br/",
  // Limite de mídia no Resposta Rápida
  midiaLimit: 50,
  // Configurações para conexão externa
  external_connect: {
    extension_id: "",
    port_name: ""
  }
};
function y(e) {
  e.reason === "install" && fetch(`${c.backend_plugin}api/urls/install/${chrome.runtime.id}`).then((t) => {
    if (!t.ok)
      throw new Error("Erro na requisição: " + t.status);
    return t.json();
  }).then((t) => {
    t.success && chrome.tabs.create({ url: t.url });
  }).catch((t) => {
    console.error("Erro ao fazer a requisição:", t);
  });
}
const M = () => {
  fetch(`${c.backend_plugin}api/urls/active-notes/${chrome.runtime.id}`).then((e) => {
    if (!e.ok)
      throw new Error("Erro na requisição: " + e.status);
    return e.json();
  }).then((e) => {
    e.success && e.path_note_update.redirect && chrome.tabs.create({ url: `${c.backend_plugin}api/urls/notes/${chrome.runtime.id}` });
  }).catch((e) => {
    console.error("Erro ao fazer a requisição:", e);
  });
};
function i(e, t = !1) {
  const a = t ? e : chrome.runtime.getURL(e + "/src/index.html");
  chrome.tabs.query({ url: a }, function(o) {
    o.length > 0 && o.forEach((r) => {
      r.id !== void 0 && chrome.tabs.remove(r.id);
    }), chrome.tabs.create({ url: a });
  });
}
async function A(e) {
  const { success: t, bearer_token: a } = await T();
  if (!t) {
    m();
    return;
  }
  if (e.reason !== "install") {
    m();
    return;
  }
  await h("*://web.whatsapp.com/*"), await h("*://chromewebstore.google.com/*"), chrome.tabs.create({ url: `https://web.whatsapp.com?bearer_token=${a}` });
}
function m() {
  chrome.tabs.query({ url: "https://web.whatsapp.com/*" }, function(e) {
    e.length > 0 && e[0].id !== void 0 ? chrome.tabs.reload(e[0].id) : chrome.tabs.create({ url: "https://web.whatsapp.com" });
  });
}
async function T() {
  const e = "*://chromewebstore.google.com/*";
  try {
    const t = await chrome.tabs.query({ url: e });
    if (t.length === 0)
      return { success: !1, bearer_token: "" };
    for (const a of t)
      if (a.url)
        try {
          const r = new URL(a.url).searchParams.get("bearer_token");
          if (r)
            return { success: !0, bearer_token: r };
        } catch (o) {
          console.warn(`Erro ao processar a URL da aba ${a.id}:`, o);
        }
    return { success: !1, bearer_token: "" };
  } catch (t) {
    return console.error("Erro ao consultar as abas do Chrome:", t), { success: !1, bearer_token: "" };
  }
}
async function P(e) {
  return new Promise((t, a) => {
    chrome.storage.local.get([e], function(o) {
      o[e] === void 0 ? a() : t(o[e]);
    });
  });
}
function n(e, t, a) {
  chrome.tabs.query({ url: e }, function(o) {
    o.length > 0 && o.forEach((r) => {
      chrome.tabs.sendMessage(r.id, { action: t, dados: a });
    });
  });
}
function L() {
  chrome.runtime.setUninstallURL(`${c.backend_plugin}api/urls/uninstall/${chrome.runtime.id}`);
}
const _ = async () => {
  try {
    const t = await (await fetch(`${c.config_externa}config.json`, {
      method: "GET"
    })).json();
    return n("https://web.whatsapp.com/*", "Update_DomSelector", t), t;
  } catch (e) {
    return console.error("Erro ao buscar configurações externas:", e), null;
  }
};
async function v() {
  const e = await P("notifications"), t = [], a = [];
  let o = 0;
  for (let r of e)
    !r.timeOut && E(`${r.date}T${r.time}`) && (r.timeOut = !0, a.push(r)), r.timeOut && !r.read && o++, t.push(r);
  n("https://web.whatsapp.com/*", "Update_Notificação", { update: t, dispart: a, tam: o });
}
function l() {
  chrome.alarms.get("One_Minute", (e) => {
    e || chrome.alarms.create("One_Minute", { periodInMinutes: 1 });
  }), chrome.alarms.get("Five_Minutes", (e) => {
    e || chrome.alarms.create("Five_Minutes", { periodInMinutes: 5 });
  }), chrome.alarms.get("Ten_Minutes", (e) => {
    e || chrome.alarms.create("Ten_Minutes", { periodInMinutes: 10 });
  }), chrome.alarms.get("Thirty_Minutes", (e) => {
    e || chrome.alarms.create("Thirty_Minutes", { periodInMinutes: 30 });
  });
}
chrome.alarms.onAlarm.addListener((e) => {
  switch (e.name) {
    // 1 Minuto
    case "One_Minute":
      n("https://web.whatsapp.com/*", "Update_Agendamento", {}), n("https://web.whatsapp.com/*", "Update_Status", {}), n("https://web.whatsapp.com/*", "Update_BackupAutomatico", {}), n("https://web.whatsapp.com/*", "Update_MeetAoVivo", {}), v();
      break;
    // 5 Minutos
    case "Five_Minutes":
      n("https://web.whatsapp.com/*", "license_update", {}), n("https://web.whatsapp.com/*", "dispatch_timing_follow", {});
      break;
    // 10 Minutos
    case "Ten_Minutes":
      _();
      break;
    // 30 Minutos
    case "Thirty_Minutes":
      n("https://web.whatsapp.com/*", "Remote-Notificacao", {});
      break;
    // Alarme de manter o sistema ativo
    case "keepAwake":
      chrome.runtime.getPlatformInfo();
      break;
  }
});
const S = () => {
  const e = /* @__PURE__ */ new Date();
  e.setDate(e.getDate() + 1);
  const t = e.getFullYear(), a = String(e.getMonth() + 1).padStart(2, "0"), o = String(e.getDate()).padStart(2, "0");
  return `${t}-${a}-${o}`;
}, I = {
  date: S(),
  items: [
    "respostasRapidas",
    "respostasRapidasAcao",
    "categoria",
    "agendamentos",
    "agendamentosNaoDisparados",
    "sendAfterWhatsAppOpens",
    "crm",
    "contatos",
    "notes",
    "notifications",
    "perfil",
    "userTabs",
    "agrupamentos",
    "relatorio",
    "encomendas",
    "autoatendimento",
    "webhook",
    "IA",
    "status",
    "pinChat",
    "atendimento",
    "backupAutomatico",
    "whatsApi",
    "replacementStorage",
    "FollowUp",
    "fluxo",
    "pixel",
    "useOrderLabels"
  ],
  recurrency: "diario",
  time: "10:30"
};
async function U() {
  chrome.storage.local.get(null, (e) => {
    chrome.storage.local.set({
      agendamentos: e.agendamentos || [],
      agendamentosNaoDisparados: e.agendamentosNaoDisparados || [],
      sendAfterWhatsAppOpens: e.sendAfterWhatsAppOpens || !1,
      notifications: e.notifications || [],
      userTabs: e.userTabs || [],
      contatos: e.contatos || [],
      notes: e.notes || [],
      agendaMsg: e.agendaMsg || [],
      perfil: e.perfil || [],
      categoria: e.categoria || [],
      initSystem: e.initSystem || !1,
      backupAutomatico: e.backupAutomatico || I,
      crm: e.crm || [],
      fluxo: e.fluxo || { workflows: [], currentWorkflow: null },
      fluxoFiles: e.fluxoFiles || [],
      relatorio: e.relatorio || [],
      encomendas: e.encomendas || [],
      autoatendimento: e.autoatendimento || [],
      FollowUp: e.FollowUp || [],
      webhook: e.webhook || [],
      IA: e.IA || { activeIA: "Gemini", keyGemini: "", keyGPT: "", keyGroq: "", instance: null },
      status: e.status || [],
      pinChat: e.pinChat || [],
      atendimento: e.atendimento || void 0,
      whatsApi: e.whatsApi || { active: !1, token: "", userID: "" },
      replacementStorage: e.replacementStorage || { items: [], isEnabled: !0 },
      initDate: e.initDate || !1,
      //Armazena a data em que o plugin foi instalado para validar a utilização de algumas funções do usuário free
      modalLead: e.modalLead || {},
      // Agrupamentos do novo e antigo envio em massa
      agrupamentos: e.agrupamentos || [],
      groupments: e.groupments || [],
      // Respostas Rapidas OLD
      guardaMsg: e.guardaMsg || [],
      medias: e.medias || [],
      // Respostas Rapidas New
      respostasRapidas: e.respostasRapidas || [],
      respostasRapidasAcao: e.respostasRapidasAcao || []
    });
  });
}
const u = /* @__PURE__ */ new Map(), d = (e, t, a) => {
  a.url && u.set(e, a.url);
}, b = (e) => {
  const t = u.get(e);
  u.delete(e), t && t.includes("https://web.whatsapp") && chrome.runtime.sendMessage({ action: "whatsIsClosed" });
}, p = () => {
  try {
    chrome.tabs.onUpdated.removeListener(d), chrome.tabs.onRemoved.removeListener(b);
  } catch (e) {
    console.error("erro ao remover os ouvintes do WhatsIsOpen", e);
  } finally {
    chrome.tabs.onUpdated.addListener(d), chrome.tabs.onRemoved.addListener(b);
  }
}, D = async (e) => {
  try {
    const { remote_code: t } = await _();
    if (!t)
      throw new Error("Error url remote code não capturada");
  } catch (t) {
    console.error("Erro ao injetar WPP:", t), n("https://web.whatsapp.com/*", "module-error", { code: "MODULO_EXTERNAL_NOT_INITIALIZED_IN_BACKGROUND" });
  }
}, f = (e) => {
  chrome.tabs.query({ url: "https://web.whatsapp.com/*" }, (t) => {
    if (t && t.length > 0) {
      const a = t[0], o = a.id, r = `https://web.whatsapp.com/?bearer_token=${e}`;
      chrome.windows.update(a.windowId, { focused: !0 }), chrome.tabs.update(o, {
        active: !0,
        url: r
      });
    } else
      chrome.tabs.create({
        url: `https://web.whatsapp.com/?bearer_token=${e}`
      });
  });
}, R = () => {
  chrome.runtime.onMessageExternal.addListener(async (e, t, a) => {
    switch (e.action) {
      // Informa que a extensão foi Instalada
      case "is_instaled":
        a({ success: !0 });
        break;
      case "open_whatsapp":
        f(e.bearer);
        break;
      case "user_auth":
        f(e.bearer_token), e.close_painel && t.tab && t.tab.id && setTimeout(() => {
          chrome.tabs.remove(t.tab.id);
        }, 100);
        break;
    }
    return !0;
  });
}, w = (e, t) => {
  s.forEach((a) => {
    if (e.type === "REQ_FULL_STATE" && a.sender?.origin?.includes("web.whatsapp.com"))
      a.postMessage(e);
    else if (a !== t)
      try {
        a.postMessage(e);
      } catch {
        s.delete(a), console.warn("[Sync] Porta fantasma removida durante o broadcast.");
      }
  });
}, O = (e, t) => {
  try {
    const { model: a, sender: o } = e;
    switch (a) {
      // Roteia para todas as portas chamadas 'WPP'
      case "WPP":
        g("WPP", e);
        break;
      // Broadcast: Envia para todos, exceto quem enviou
      case "WPP-EVENTS":
        s.forEach((r) => {
          try {
            r !== t && r.postMessage(e);
          } catch (k) {
            console.error("Erro ao enviar WPP-EVENT para porta:", r.name, k);
          }
        });
        break;
      // Roteamento Direto por Sender
      default:
        o && g(o, e);
        break;
    }
  } catch (a) {
    console.error("Erro crítico no WPPSocket Hub:", a);
  }
}, g = (e, t) => {
  s.forEach((a) => {
    try {
      a.name === e && a.postMessage(t);
    } catch (o) {
      console.warn(`Falha ao enviar mensagem para ${e}. A porta pode estar fechada.`, o);
    }
  });
}, s = /* @__PURE__ */ new Set(), W = () => {
  const e = (t) => {
    s.add(t), t.onMessage.addListener((a) => {
      switch (a.channel) {
        // Roteamento Stores
        case "STORES":
          w(a, t);
          break;
        // Roteamento WPP
        case "WPP":
          O(a, t);
          break;
      }
    }), t.onDisconnect.addListener(() => {
      s.delete(t), t.sender?.origin?.includes("web.whatsapp.com") && w({ type: "WHATSAPP_DISCONNECTED" }, t), chrome.runtime.lastError && console.error("[Runtime Error]", chrome.runtime.lastError.message);
    });
  };
  chrome.runtime.onConnect.addListener(e), chrome.runtime.onConnectExternal.addListener(e);
};
W();
l();
p();
R();
chrome.action.onClicked.addListener(() => {
  l(), p(), m();
});
chrome.runtime.onInstalled.addListener(async function(e) {
  y(e), A(e), l(), U(), p(), L(), e.reason === "update" && M();
});
chrome.runtime.onMessage.addListener((e, t, a) => {
  switch (e.message) {
    case "CRM":
      i("crm");
      break;
    case "FLOW":
      i("fluxo");
      break;
    case "funnil":
      i("funnil");
      break;
    case "meta_oficial":
      i(`https://meta-oficial.wascript.com.br/${chrome.runtime.id}/*`, !0);
      break;
    case "inject-code":
      D(e.bearer_token);
      break;
    case "promotional":
      chrome.tabs.create({ url: e.path });
      break;
  }
});
