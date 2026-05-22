# TDDAB Dependencies

## Stato attuale

```mermaid
graph TB
    classDef planner fill:#FF9800,stroke:#E65100,color:#fff
    classDef overlay fill:#FFC107,stroke:#F57F17,color:#000
    classDef loader fill:#2196F3,stroke:#1565C0,color:#fff
    classDef junior fill:#9C27B0,stroke:#6A1B9A,color:#fff
    classDef broken fill:#F44336,stroke:#B71C1C,color:#fff
    classDef v2 fill:#4CAF50,stroke:#2E7D32,color:#fff

    subgraph L1["LIVELLO 1: Principi TDDAB"]
        TP["tddab-planner v1<br/>principi + C# + vs-mcp<br/>TUTTO MISCHIATO"]:::planner
        WSL["wsl-tddab-planner v1<br/>copia di v1 + dotnet CLI"]:::planner
        YTP["y-tddab-planner v1<br/>copia di v1 + agenti"]:::planner
        V2["tddab-planner-v2<br/>principi + tag XML<br/>NESSUNO LO USA"]:::v2
    end

    subgraph L2["LIVELLO 2: Overlay lingua/tool"]
        TSOV["typescript-tddab-overlay<br/>370 righe, ripete principi"]:::overlay
        BBC["bbc-tddab-planner<br/>BBC + principi ripetuti"]:::overlay
    end

    subgraph L3["LIVELLO 3: Comandi"]
        XCS["x-csharp-tddab"]:::loader
        XTS["x-typescript-tddab"]:::loader
        XNPM["x-ts-npm-tddab"]:::loader
        XNX["x-ts-nx-tddab"]:::loader
        XJA["x-java-tddab"]:::loader
        WCS["w-csharp-tddab"]:::loader
        WTS["w-ts-tddab"]:::loader
        YCS["y-csharp-tddab"]:::loader
    end

    subgraph JR["JUNIOR WORKFLOW"]
        JD["j-develop"]:::junior
        JNF["j-new-feature"]:::junior
        JB["j-bug"]:::junior
        JR2["j-review-plan"]:::junior
    end

    JSET["j-settings.md<br/>PATH ROTTO"]:::broken

    XCS -->|reads| TP
    XJA -->|reads| TP
    XTS -->|reads| TSOV
    XNPM -->|reads| TSOV
    XNX -->|reads| TSOV
    WCS -->|reads| WSL
    WTS -->|reads| WSL
    YCS -->|reads| YTP

    JD --> JSET
    JNF --> JSET
    JB --> JSET
    JR2 --> JSET
    JSET -.-x TSOV
```

## Come dovrebbe essere

```mermaid
graph TB
    classDef principles fill:#4CAF50,stroke:#2E7D32,color:#fff
    classDef lang fill:#2196F3,stroke:#1565C0,color:#fff
    classDef env fill:#00BCD4,stroke:#00838F,color:#fff
    classDef method fill:#FF9800,stroke:#E65100,color:#fff
    classDef command fill:#9C27B0,stroke:#6A1B9A,color:#fff

    subgraph L1["LIVELLO 1: Principi TDDAB"]
        V2["tddab-planner-v2<br/>metodologia + tag XML<br/>universale, zero lang"]:::principles
    end

    subgraph L2L["LIVELLO 2a: Overlay LINGUA"]
        CS["csharp-overlay<br/>xUnit, dotnet build/test"]:::lang
        TS["typescript-overlay<br/>Vitest, npm/nx"]:::lang
        JA["java-overlay<br/>JUnit, gradle"]:::lang
    end

    subgraph L2E["LIVELLO 2b: Overlay AMBIENTE"]
        XV["x = VS + vs-mcp"]:::env
        WL["w = WSL + lsai + CLI"]:::env
        YA["y = agent-optimized"]:::env
    end

    subgraph L2M["LIVELLO 2c: Overlay METODO"]
        BB["bbc = scope + mock + coverage<br/>multilang"]:::method
    end

    subgraph L3["LIVELLO 3: Comandi = L1 + L2a + L2b"]
        XCS2["x-csharp-tddab<br/>= V2 + CS + VS"]:::command
        WCS2["w-csharp-tddab<br/>= V2 + CS + WSL"]:::command
        YCS2["y-csharp-tddab<br/>= V2 + CS + agent"]:::command
        XTS2["x-typescript-tddab<br/>= V2 + TS + VS"]:::command
        WTS2["w-typescript-tddab<br/>= V2 + TS + WSL"]:::command
        BP["bbc-plan<br/>= V2 + BBC + lingua"]:::command
    end

    CS --> V2
    TS --> V2
    JA --> V2

    XCS2 --> CS
    XCS2 --> XV
    WCS2 --> CS
    WCS2 --> WL
    YCS2 --> CS
    YCS2 --> YA
    XTS2 --> TS
    XTS2 --> XV
    WTS2 --> TS
    WTS2 --> WL
    BP --> BB
```

## Problemi

| Problema | Dettaglio |
|----------|-----------|
| Principi duplicati 3x | tddab-planner, wsl-tddab-planner, y-tddab-planner hanno gli stessi principi copia-incollati |
| Nessuna separazione | Principi, codice C#, comandi di verifica tutti nello stesso file |
| v2 isolato | tddab-planner-v2 esiste ma nessun loader/skill lo referenzia |
| Overlay ripete principi | typescript-tddab-overlay ripete le regole TDDAB invece di solo aggiungere il delta TS |
| j-settings rotto | Path punta a support/mind-sets/ che non esiste |
| 8 loader quasi identici | Solo 2-3 righe diverse tra loro, variano solo quale mindset leggono |
| allowed-tools spreco | Ogni loader ha 50+ tool nella lista, brucia token inutilmente |
| BBC non ha overlay | bbc-tddab-planner mescola principi+BBC+C#, ma BBC e multilang |
| Ambiente nei principi | x/w/y distingue solo l'ambiente (VS/WSL/agent) ma i file v1 mescolano ambiente dentro i principi |
