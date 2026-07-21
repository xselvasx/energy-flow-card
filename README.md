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

## Licenza

MIT — vedi [LICENSE](LICENSE).

## Changelog

### v1.1.0
- Nodi (rete, EV, solare, batteria) spostati più verso l'esterno per una migliore leggibilità.
- Divisore di potenza configurabile per singola entità (`grid_power_divider`, `solar_power_divider`, `battery_power_divider`, `ev_power_divider`), con fallback sul divisore globale.
- Corretto il flusso di energia del veicolo elettrico che non compariva all'attivazione.

### v1.0.0
- Prima release.
