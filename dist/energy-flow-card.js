/**
 * Energy Flow Card
 * Custom Lovelace card per Home Assistant che visualizza il flusso energetico
 * tra rete, fotovoltaico, batteria, casa e (opzionale) veicolo elettrico.
 *
 * @license MIT
 */

const LitElement = Object.getPrototypeOf(
  customElements.get("ha-panel-lovelace") ||
    customElements.get("hui-view") ||
    customElements.get("home-assistant-main")
);
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

const CARD_VERSION = "1.2.0";

console.info(
  `%c ENERGY-FLOW-CARD %c v${CARD_VERSION} `,
  "color: #eef0f4; background: #1a1d24; font-weight: 700;",
  "color: #1a1d24; background: #4cd07d; font-weight: 700;"
);

// Geometria di riferimento (coordinate SVG); l'intero stage scala su queste.
const VW = 380;
const VH = 120;

class EnergyFlowCard extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      _config: { state: true },
    };
  }

  static getConfigElement() {
    return document.createElement("energy-flow-card-editor");
  }

  static getStubConfig() {
    return {
      ev_enabled: false,
      solar_power_entity: "",
      grid_power_entity: "",
      battery_power_entity: "",
      battery_soc_entity: "",
      ev_power_entity: "",
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Configurazione non valida");
    this._config = {
      title: "",
      ev_enabled: false,
      power_divider: 1,
      ...config,
    };
  }

  getCardSize() {
    return 2;
  }

  _num(entityId, fallback = 0) {
    if (!entityId || !this.hass) return fallback;
    const st = this.hass.states[entityId];
    if (!st) return fallback;
    const v = parseFloat(st.state);
    return Number.isFinite(v) ? v : fallback;
  }

  _div(key) {
    const per = this._config[key + "_power_divider"];
    const n = Number(per);
    if (Number.isFinite(n) && n !== 0) return n;
    const g = Number(this._config.power_divider);
    return Number.isFinite(g) && g !== 0 ? g : 1;
  }

  _power(entityKey, divKey) {
    return this._num(this._config[entityKey]) / this._div(divKey);
  }

  _fmt(kw) {
    const abs = Math.abs(kw);
    return (kw < 0 ? "-" : "") + abs.toFixed(1) + " kW";
  }

  _dur(power) {
    return Math.max(0.4, Math.min(3.5, 4 / (Math.abs(power) + 0.5)));
  }

  // Converte coordinate SVG (0..VW / 0..VH) in percentuali per il posizionamento
  _px(x) {
    return (x / VW) * 100;
  }
  _py(y) {
    return (y / VH) * 100;
  }

  render() {
    if (!this._config || !this.hass) return html``;

    const solar = this._power("solar_power_entity", "solar");
    const grid = this._power("grid_power_entity", "grid");
    const batt = this._power("battery_power_entity", "battery");
    const soc = this._num(this._config.battery_soc_entity, 0);
    const evOn = !!this._config.ev_enabled;
    const evP = this._power("ev_power_entity", "ev");

    const solarDir = solar >= 0 ? "normal" : "reverse";
    const gridDir = grid >= 0 ? "normal" : "reverse";
    const battDir = batt >= 0 ? "normal" : "reverse";
    const evDir = evP >= 0 ? "reverse" : "normal";

    const homeVal =
      Math.abs(solar) +
      Math.abs(grid >= 0 ? grid : 0) +
      Math.abs(batt >= 0 ? batt : 0);

    const battColor =
      soc < 20 ? "#ef4444" : soc < 80 ? "#f5a623" : "#4cd07d";
    const battFillWidth = Math.max(1, Math.round((soc / 100) * 13));

    // Posizioni nodi (coordinate SVG). Rete/EV a sinistra, Solare/Batteria a destra.
    const gridNodeY = evOn ? 40 : 60;

    const gridPathD = evOn
      ? "M 40 40 C 70 38, 130 46, 168 56"
      : "M 40 60 L 168 60";
    const solarPathD = "M 340 40 C 310 38, 250 46, 212 56";
    const battPathD = "M 340 80 C 310 82, 250 74, 212 64";
    const evPathD = "M 40 80 C 70 82, 130 74, 168 64";

    const gridLabelX = evOn ? 100 : 100;
    const gridLabelY = evOn ? 26 : 48;

    const th = 0.02;
    const solarOpacity = Math.abs(solar) < th ? 0 : 1;
    const gridOpacity = Math.abs(grid) < th ? 0 : 1;
    const battOpacity = Math.abs(batt) < th ? 0 : 1;
    const evOpacity = Math.abs(evP) < th ? 0 : 1;

    return html`
      <ha-card>
        ${this._config.title
          ? html`<div class="card-title">${this._config.title}</div>`
          : ""}
        <div class="stage">
          <svg viewBox="0 0 ${VW} ${VH}" class="flow-svg" preserveAspectRatio="xMidYMid meet">
            <!-- tracce di fondo -->
            <path d="${gridPathD}" fill="none" stroke="#2c313d" stroke-width="7" stroke-linecap="round"></path>
            <path d="${solarPathD}" fill="none" stroke="#2c313d" stroke-width="7" stroke-linecap="round"></path>
            <path d="${battPathD}" fill="none" stroke="#2c313d" stroke-width="7" stroke-linecap="round"></path>
            ${evOn
              ? html`<path d="${evPathD}" fill="none" stroke="#2c313d" stroke-width="7" stroke-linecap="round"></path>`
              : ""}

            <!-- flussi animati -->
            <path
              d="${gridPathD}"
              fill="none"
              stroke="#5b8def"
              stroke-width="7"
              stroke-linecap="round"
              stroke-dasharray="6 14"
              style="opacity:${gridOpacity};animation:eflow 1s linear infinite;animation-duration:${this._dur(
                grid
              )}s;animation-direction:${gridDir};"
            ></path>
            <path
              d="${solarPathD}"
              fill="none"
              stroke="#f5a623"
              stroke-width="7"
              stroke-linecap="round"
              stroke-dasharray="6 14"
              style="opacity:${solarOpacity};animation:eflow 1s linear infinite;animation-duration:${this._dur(
                solar
              )}s;animation-direction:${solarDir};"
            ></path>
            <path
              d="${battPathD}"
              fill="none"
              stroke="#4cd07d"
              stroke-width="7"
              stroke-linecap="round"
              stroke-dasharray="6 14"
              style="opacity:${battOpacity};animation:eflow 1s linear infinite;animation-duration:${this._dur(
                batt
              )}s;animation-direction:${battDir};"
            ></path>
            ${evOn
              ? html`<path
                  d="${evPathD}"
                  fill="none"
                  stroke="#c084fc"
                  stroke-width="7"
                  stroke-linecap="round"
                  stroke-dasharray="6 14"
                  style="opacity:${evOpacity};animation:eflow 1s linear infinite;animation-duration:${this._dur(
                    evP
                  )}s;animation-direction:${evDir};"
                ></path>`
              : ""}
          </svg>

          <!-- nodo rete -->
          <div class="node" style="left:${this._px(40)}%;top:${this._py(
            gridNodeY
          )}%;background:#182236;border-color:#5b8def;color:#5b8def;">
            <svg viewBox="0 0 24 24" class="ico" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2 L17 9 L7 9 Z"></path>
              <line x1="12" y1="9" x2="12" y2="22"></line>
              <line x1="7" y1="22" x2="12" y2="9"></line>
              <line x1="17" y1="22" x2="12" y2="9"></line>
              <line x1="8" y1="14" x2="16" y2="14"></line>
              <line x1="3" y1="5" x2="21" y2="5"></line>
              <line x1="3" y1="5" x2="7" y2="9"></line>
              <line x1="21" y1="5" x2="17" y2="9"></line>
            </svg>
          </div>

          <!-- nodo solare -->
          <div class="node" style="left:${this._px(340)}%;top:${this._py(
            40
          )}%;background:#2a2416;border-color:#f5a623;color:#f5a623;">
            <svg viewBox="0 0 24 24" class="ico" style="width:26px;height:26px;" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="5.5" r="2.3"></circle>
              <line x1="12" y1="0.8" x2="12" y2="2.3"></line>
              <line x1="6.8" y1="5.5" x2="8.3" y2="5.5"></line>
              <line x1="15.7" y1="5.5" x2="17.2" y2="5.5"></line>
              <line x1="8.3" y1="1.8" x2="9.2" y2="2.7"></line>
              <line x1="15.7" y1="1.8" x2="14.8" y2="2.7"></line>
              <rect x="4" y="12" width="16" height="8" rx="0.8"></rect>
              <line x1="4" y1="16" x2="20" y2="16"></line>
              <line x1="9.3" y1="12" x2="9.3" y2="20"></line>
              <line x1="14.7" y1="12" x2="14.7" y2="20"></line>
            </svg>
          </div>

          <!-- nodo batteria -->
          <div class="node" style="left:${this._px(340)}%;top:${this._py(
            80
          )}%;background:#152819;border-color:#4cd07d;color:${battColor};">
            <svg viewBox="0 0 24 24" class="ico" style="width:29px;height:29px;" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="7" width="17" height="10" rx="1.5"></rect>
              <rect x="19.5" y="10" width="2" height="4" rx="0.6" fill="currentColor" stroke="none"></rect>
              <rect x="4" y="9" height="6" fill="currentColor" stroke="none" width="${battFillWidth}"></rect>
            </svg>
          </div>

          <!-- nodo veicolo elettrico (opzionale) -->
          ${evOn
            ? html`
                <div class="node" style="left:${this._px(40)}%;top:${this._py(
                  80
                )}%;background:#221a2e;border-color:#c084fc;color:#c084fc;">
                  <svg viewBox="0 0 24 24" class="ico" style="width:30px;height:30px;" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="5" y="3" width="9" height="18" rx="1.5"></rect>
                    <path d="M5 21 L14 21"></path>
                    <rect x="7.5" y="6" width="4" height="4" rx="0.6"></rect>
                    <path d="M14 8 L16.5 8 Q17.5 8 17.5 9 L17.5 13 Q17.5 14 18.5 14 Q19.5 14 19.5 13 L19.5 10"></path>
                    <path d="M10.2 12.5 L8.6 15.5 L10 15.5 L9 18" stroke-width="1.3"></path>
                  </svg>
                </div>
                <div class="label" style="left:${this._px(100)}%;top:${this._py(
                  100
                )}%;color:#c084fc;">
                  ${this._fmt(Math.abs(evP))}
                </div>
              `
            : ""}

          <!-- etichette -->
          <div class="label" style="left:${this._px(
            gridLabelX
          )}%;top:${this._py(gridLabelY)}%;color:#5b8def;">
            ${this._fmt(grid)}
          </div>
          <div class="label" style="left:${this._px(290)}%;top:${this._py(
            18
          )}%;color:#f5a623;">
            ${this._fmt(solar)}
          </div>
          <div class="label" style="left:${this._px(290)}%;top:${this._py(
            102
          )}%;color:#4cd07d;">
            ${this._fmt(batt)}
          </div>

          <!-- nodo casa -->
          <div class="home" style="left:${this._px(190)}%;top:${this._py(
            60
          )}%;">
            <div class="home-emoji">🏠</div>
            <div class="home-val">${this._fmt(homeVal)}</div>
          </div>
        </div>
      </ha-card>
    `;
  }

  static get styles() {
    return css`
      ha-card {
        background: #1a1d24;
        border-radius: 18px;
        padding: 16px;
        box-sizing: border-box;
        color: #eef0f4;
        overflow: hidden;
      }
      .card-title {
        font-size: 15px;
        font-weight: 700;
        margin-bottom: 10px;
        color: #eef0f4;
      }
      /* Lo stage mantiene le proporzioni ma scala con la larghezza
         disponibile: cosi' i nodi restano allineati su qualsiasi schermo. */
      .stage {
        position: relative;
        width: 100%;
        max-width: 380px;
        margin: 0 auto;
        aspect-ratio: 380 / 120;
      }
      .flow-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
      }
      .node {
        position: absolute;
        transform: translate(-50%, -50%);
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 2px solid;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
      }
      .ico {
        width: 24px;
        height: 24px;
      }
      .label {
        position: absolute;
        transform: translate(-50%, -50%);
        background: #1a1d24;
        padding: 1px 6px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
      }
      .home {
        position: absolute;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1px;
        background: #22262e;
        border-radius: 50%;
        width: 52px;
        height: 52px;
        justify-content: center;
        box-shadow: 0 0 0 4px #1a1d24, 0 0 0 5px #3a3f4a;
      }
      .home-emoji {
        font-size: 13px;
      }
      .home-val {
        font-size: 11px;
        font-weight: 800;
        color: #fff;
      }
      @keyframes eflow {
        to {
          stroke-dashoffset: -20;
        }
      }
    `;
  }
}

customElements.define("energy-flow-card", EnergyFlowCard);

/* ------------------------------------------------------------------ */
/* Editor grafico della configurazione                                 */
/* ------------------------------------------------------------------ */

class EnergyFlowCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      _config: { state: true },
    };
  }

  setConfig(config) {
    this._config = { ...config };
  }

  _fireChanged(config) {
    const ev = new CustomEvent("config-changed", {
      detail: { config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(ev);
  }

  _valueChanged(field, value) {
    const config = { ...this._config };
    if (value === "" || value === undefined || value === null) {
      delete config[field];
    } else {
      config[field] = value;
    }
    this._config = config;
    this._fireChanged(config);
  }

  _entityRow(label, entityField, divField) {
    return html`
      <div class="row">
        <ha-entity-picker
          .hass=${this.hass}
          .value=${this._config[entityField] || ""}
          .label=${label}
          allow-custom-entity
          @value-changed=${(e) =>
            this._valueChanged(entityField, e.detail.value)}
        ></ha-entity-picker>
        <ha-textfield
          class="divider"
          label="Divisore"
          type="number"
          .value=${this._config[divField] ?? ""}
          placeholder=${this._config.power_divider ?? 1}
          @input=${(e) =>
            this._valueChanged(
              divField,
              e.target.value === "" ? "" : Number(e.target.value)
            )}
        ></ha-textfield>
      </div>
    `;
  }

  render() {
    if (!this._config || !this.hass) return html``;
    return html`
      <div class="editor">
        <ha-textfield
          label="Titolo (opzionale)"
          .value=${this._config.title || ""}
          @input=${(e) => this._valueChanged("title", e.target.value)}
        ></ha-textfield>

        <ha-textfield
          label="Divisore potenza globale (1 = kW, 1000 = W)"
          type="number"
          .value=${this._config.power_divider ?? 1}
          @input=${(e) =>
            this._valueChanged("power_divider", Number(e.target.value) || 1)}
        ></ha-textfield>
        <div class="hint">
          Il divisore per singola entita' e' opzionale: se vuoto usa quello
          globale.
        </div>

        <div class="section">Flussi energia</div>
        ${this._entityRow("Potenza rete", "grid_power_entity", "grid_power_divider")}
        ${this._entityRow("Potenza fotovoltaico", "solar_power_entity", "solar_power_divider")}
        ${this._entityRow("Potenza batteria", "battery_power_entity", "battery_power_divider")}
        <ha-entity-picker
          .hass=${this.hass}
          .value=${this._config.battery_soc_entity || ""}
          .label=${"Stato di carica batteria (%)"}
          allow-custom-entity
          @value-changed=${(e) =>
            this._valueChanged("battery_soc_entity", e.detail.value)}
        ></ha-entity-picker>

        <div class="section">Veicolo elettrico</div>
        <ha-formfield label="Mostra veicolo elettrico">
          <ha-switch
            .checked=${!!this._config.ev_enabled}
            @change=${(e) => this._valueChanged("ev_enabled", e.target.checked)}
          ></ha-switch>
        </ha-formfield>
        ${this._config.ev_enabled
          ? this._entityRow(
              "Potenza ricarica veicolo",
              "ev_power_entity",
              "ev_power_divider"
            )
          : ""}
      </div>
    `;
  }

  static get styles() {
    return css`
      .editor {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 8px 0;
      }
      .section {
        font-weight: 700;
        margin-top: 8px;
        color: var(--primary-text-color);
      }
      .hint {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-top: -6px;
      }
      .row {
        display: flex;
        gap: 8px;
        align-items: flex-end;
      }
      .row ha-entity-picker {
        flex: 1;
      }
      .row .divider {
        width: 96px;
        flex: 0 0 auto;
      }
      ha-textfield,
      ha-entity-picker {
        width: 100%;
      }
    `;
  }
}

customElements.define("energy-flow-card-editor", EnergyFlowCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "energy-flow-card",
  name: "Energy Flow Card",
  description:
    "Card animata del flusso energetico tra rete, fotovoltaico, batteria, casa e veicolo elettrico.",
  preview: true,
  documentationURL: "https://github.com/xselvasx/energy-flow-card",
});
