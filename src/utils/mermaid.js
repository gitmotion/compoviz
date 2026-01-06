import { normalizeDependsOn, normalizeArray } from './validation';

/**
 * Generates a Mermaid flowchart graph from the compose state.
 * @param {object} state - The compose state.
 * @returns {string} The Mermaid graph definition.
 */
export const generateMermaidGraph = (state) => {
    const serviceCount = Object.keys(state.services || {}).length;
    const networkCount = Object.keys(state.networks || {}).length;
    const volumeCount = Object.keys(state.volumes || {}).length;

    // Choose layout direction based on complexity
    const direction = serviceCount > 6 ? 'LR' : 'TB';

    let graph = `flowchart ${direction}\n`;

    // Enhanced class definitions with gradients and glow effects
    graph += `  %% Service nodes - Blue gradient with glow\n`;
    graph += `  classDef service fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff,rx:12,ry:12\n`;
    graph += `  classDef serviceHover fill:#1d4ed8,stroke:#60a5fa,stroke-width:3px,color:#fff\n`;

    graph += `  %% Network nodes - Emerald with circuit pattern\n`;
    graph += `  classDef network fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff\n`;

    graph += `  %% Volume nodes - Amber/Orange storage\n`;
    graph += `  classDef volume fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fff\n`;

    graph += `  %% Secret nodes - Purple secure\n`;
    graph += `  classDef secret fill:#581c87,stroke:#a855f7,stroke-width:2px,color:#fff\n`;

    graph += `  %% Edge styles\n`;
    graph += `  linkStyle default stroke:#64748b,stroke-width:2px\n`;

    graph += `\n`;

    // Generate service nodes with rich HTML content
    if (serviceCount > 0) {
        graph += `  subgraph services [" 🐳 SERVICES "]\n`;
        graph += `    direction ${direction}\n`;
        Object.entries(state.services || {}).forEach(([name, svc]) => {
            const img = svc.image ? `📦 ${svc.image}` : '⚠️ no image';
            const portsArr = normalizeArray(svc.ports);
            const ports = portsArr.length > 0
                ? `🔌 ${portsArr.slice(0, 2).join(', ')}${portsArr.length > 2 ? '...' : ''}`
                : '';
            const hasHealth = svc.healthcheck?.test ? '💚' : '';
            const hasResources = svc.deploy?.resources?.limits?.memory ? '📊' : '';

            // Build rich label
            let label = `<div style='padding:8px;text-align:center;'>`;
            label += `<div style='font-size:16px;font-weight:700;margin-bottom:4px;'>${hasHealth}${hasResources} ${name}</div>`;
            label += `<div style='font-size:11px;opacity:0.85;'>${img}</div>`;
            if (ports) label += `<div style='font-size:10px;opacity:0.7;margin-top:2px;'>${ports}</div>`;
            label += `</div>`;

            graph += `    ${name}["${label}"]:::service\n`;
        });
        graph += `  end\n\n`;
    }

    // Generate network nodes
    if (networkCount > 0) {
        graph += `  subgraph networks [" 🌐 NETWORKS "]\n`;
        graph += `    direction ${direction}\n`;
        Object.entries(state.networks || {}).forEach(([name, net]) => {
            const driver = net.driver || 'bridge';
            const external = net.external ? '🔗' : '';
            graph += `    net_${name}(("${external}${name}<br/><small>${driver}</small>")):::network\n`;
        });
        graph += `  end\n\n`;
    }

    // Generate volume nodes
    if (volumeCount > 0) {
        graph += `  subgraph volumes [" 💾 VOLUMES "]\n`;
        graph += `    direction ${direction}\n`;
        Object.entries(state.volumes || {}).forEach(([name, vol]) => {
            const driver = vol.driver || 'local';
            const external = vol.external ? '🔗' : '';
            graph += `    vol_${name}[("${external}${name}<br/><small>${driver}</small>")]:::volume\n`;
        });
        graph += `  end\n\n`;
    }

    // Generate secrets nodes
    const secretCount = Object.keys(state.secrets || {}).length;
    if (secretCount > 0) {
        graph += `  subgraph secrets [" 🔐 SECRETS "]\n`;
        Object.keys(state.secrets || {}).forEach(name => {
            graph += `    sec_${name}{{"🔑 ${name}"}}:::secret\n`;
        });
        graph += `  end\n\n`;
    }

    // Generate relationships with styled edges
    let edgeIndex = 0;
    const dependsOnEdges = [];
    const networkEdges = [];
    const volumeEdges = [];

    Object.entries(state.services || {}).forEach(([name, svc]) => {
        // Dependency edges (thick pink arrow)
        normalizeDependsOn(svc.depends_on).forEach(dep => {
            if (state.services && state.services[dep]) {
                graph += `  ${dep} ==> ${name}\n`;
                dependsOnEdges.push(edgeIndex++);
            }
        });

        // Network connections (cyan dashed)
        normalizeArray(svc.networks).forEach(net => {
            if (state.networks && state.networks[net]) {
                graph += `  ${name} --- net_${net}\n`;
                networkEdges.push(edgeIndex++);
            }
        });

        // Volume mounts (amber dotted)
        normalizeArray(svc.volumes).forEach(vol => {
            const volName = typeof vol === 'string' ? vol.split(':')[0] : '';
            if (volName && state.volumes && state.volumes[volName]) {
                graph += `  vol_${volName} -.-> ${name}\n`;
                volumeEdges.push(edgeIndex++);
            }
        });
    });

    // Apply edge styles
    if (dependsOnEdges.length > 0) {
        graph += `  linkStyle ${dependsOnEdges.join(',')} stroke:#f472b6,stroke-width:3px\n`;
    }
    if (networkEdges.length > 0) {
        graph += `  linkStyle ${networkEdges.join(',')} stroke:#22d3ee,stroke-width:2px,stroke-dasharray:5\n`;
    }
    if (volumeEdges.length > 0) {
        graph += `  linkStyle ${volumeEdges.join(',')} stroke:#fbbf24,stroke-width:2px,stroke-dasharray:3\n`;
    }

    return graph;
};
