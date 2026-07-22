# Energy Flow Card

Card personalizzata per Home Assistant che visualizza in modo animato il flusso di energia tra **rete elettrica**, **fotovoltaico**, **batteria**, **casa** e, opzionalmente, **veicolo elettrico**.

Ogni campo di potenza e lo stato di carica della batteria è collegabile a un'entità di Home Assistant. La presenza del veicolo elettrico si abilita/disabilita direttamente dalla configurazione della card.

![preview](preview.png)

## Installazione tramite HACS

1. In HACS → menu (⋮ in alto a destra) → **Custom repositories**.
2. Aggiungi l'URL di questo repository, categoria **Dashboard** (Lovelace).
3. Cerca **Energy Flow Card** e installa.
4. Ricarica la pagina del browser (Ctrl+F5).

La risorsa Lovelace viene registrata automaticamente da HACS. Se usi lo YAML mode aggiungi manualmente:

```yaml
resources:
  - url: /hacsfiles/energy-flow-card/energy-flow-card.js
    type: module
```

## Installazione manuale

1. Copia `dist/energy-flow-card.js` in `<config>/www/energy-flow-card.js`.
2. Impostazioni → Dashboard → ⋮ → **Risorse** → aggiungi:
   - URL: `/local/energy-flow-card.js`
   - Tipo: **Modulo JavaScript**

## Configurazione

La card ha un editor grafico integrato: aggiungila da **Aggiungi scheda → Personalizzata: Energy Flow Card** e compila i campi con il selettore entità.

### Opzioni

| Opzione | Tipo | Default | Descrizione |
|---|---|---|---|
| `type` | string | — | `custom:energy-flow-card` (obbligatorio) |
| `title` | string | `""` | Titolo mostrato sopra la card |
| `grid_power_entity` | entity | — | Potenza scambiata con la rete (positiva = prelievo, negativa = immissione) |
| `solar_power_entity` | entity | — | Potenza prodotta dal fotovoltaico |
| `battery_power_entity` | entity | — | Potenza batteria (positiva = scarica, negativa = carica) |
| `battery_soc_entity` | entity | — | Stato di carica batteria in `%` |
| `battery2_enabled` | boolean | `false` | Abilita la seconda batteria nello stesso nodo |
| `battery2_power_entity` | entity | — | Potenza della seconda batteria (usata solo se `battery2_enabled: true`) |
| `battery2_soc_entity` | entity | — | Stato di carica della seconda batteria in `%` |
| `battery2_power_divider` | number | — | Divisore solo per la seconda batteria (opzionale) |
| `ev_enabled` | boolean | `false` | Mostra il nodo veicolo elettrico |
| `ev_power_entity` | entity | — | Potenza di ricarica del veicolo (usata solo se `ev_enabled: true`) |
| `power_divider` | number | `1` | Divisore **globale**. Usa `1` se le entità sono in **kW**, `1000` se in **W** |
| `grid_power_divider` | number | — | Divisore solo per la rete (opzionale, sovrascrive quello globale) |
| `solar_power_divider` | number | — | Divisore solo per il fotovoltaico (opzionale) |
| `battery_power_divider` | number | — | Divisore solo per la batteria (opzionale) |
| `ev_power_divider` | number | — | Divisore solo per il veicolo (opzionale) |

Il divisore per singola entità è opzionale: se non impostato, viene usato `power_divider`. Utile quando le entità hanno unità di misura diverse (es. rete in W e batteria in kW).

### Esempio YAML

```yaml
type: custom:energy-flow-card
title: Flusso energetico
grid_power_entity: sensor.potenza_rete
solar_power_entity: sensor.potenza_fotovoltaico
battery_power_entity: sensor.potenza_batteria
battery_soc_entity: sensor.batteria_soc
power_divider: 1000          # default: entità in Watt
battery_power_divider: 1     # ...ma la batteria è già in kW
ev_enabled: true
ev_power_entity: sensor.potenza_wallbox
```

### Convenzioni sui segni

- **Rete**: valore positivo = prelievo dalla rete, negativo = immissione.
- **Batteria**: valore positivo = scarica (fornisce alla casa), negativo = carica.
- **Fotovoltaico**: normalmente positivo.
- Il valore **casa** viene calcolato automaticamente come somma dei contributi entranti.
- Il colore della batteria cambia in base al SoC: rosso `<20%`, arancio `<80%`, verde `≥80%`.
- Con la **seconda batteria** abilitata compaiono due icone impilate nello stesso cerchio, ciascuna colorata secondo il proprio SoC. Il valore di potenza mostrato e la direzione del flusso seguono la **somma** delle due potenze.

## Licenza

MIT — vedi [LICENSE](LICENSE).

## Changelog

### v1.6.1
- Corretto lo sfondo della card che restava opaco invece di ereditare l'effetto vetro/traslucido dei temi che lo applicano tramite `backdrop-filter`: le variabili di stile di `ha-card` (sfondo, bordo, ombra, backdrop-filter) vengono ora ridichiarate esplicitamente, perche' le regole CSS globali del tema non attraversano lo shadow DOM della card.

### v1.6.0
- Lo sfondo della card ora eredita lo stile del tema di Home Assistant (chiaro/scuro) come le card native, tramite le variabili CSS del tema.
- Icone della doppia batteria centrate anche orizzontalmente.

### v1.5.1
- Le due icone della batteria sono ora piu' vicine al centro del cerchio (viewBox ritagliato per eliminare lo spazio verticale vuoto).

### v1.5.0
- Seconda batteria opzionale: abilitabile da selettore, con entita' di potenza e SoC dedicate e relativa scalatura.
- Due icone impilate nel cerchio batteria, ciascuna colorata secondo il proprio stato di carica.
- Il valore di potenza mostrato e il flusso seguono la somma delle potenze delle due batterie.

### v1.4.0
- Risolto definitivamente il flusso del veicolo elettrico che non veniva disegnato: i tracciati SVG erano generati nel namespace HTML e quindi ignorati dal browser.
- Etichette di rete e fotovoltaico allineate alla stessa altezza (layout simmetrico).

### v1.3.0
- Corretta la sovrapposizione verticale dei nodi su schermi stretti: maggiore distanza tra le icone e SVG allineato ai nodi.
- Corretto il tracciato del flusso veicolo elettrico che non compariva pur con potenza maggiore di zero.

### v1.2.0
- Layout completamente responsive: lo stage scala mantenendo le proporzioni, i nodi restano centrati e allineati anche su mobile.
- Traccia del ramo veicolo elettrico sempre allineata al nodo.

### v1.1.0
- Nodi (rete, EV, solare, batteria) spostati più verso l'esterno per una migliore leggibilità.
- Divisore di potenza configurabile per singola entità (`grid_power_divider`, `solar_power_divider`, `battery_power_divider`, `ev_power_divider`), con fallback sul divisore globale.
- Corretto il flusso di energia del veicolo elettrico che non compariva all'attivazione.

### v1.0.0
- Prima release.
