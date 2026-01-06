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

    graph += `  %% Config nodes - Cyan config\n`;
    graph += `  classDef config fill:#164e63,stroke:#06b6d4,stroke-width:2px,color:#fff\n`;

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
            // vol can be null in compose files (empty volume definition)
            const driver = vol?.driver || 'local';
            const external = vol?.external ? '🔗' : '';
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

    // Generate configs nodes
    const configCount = Object.keys(state.configs || {}).length;
    if (configCount > 0) {
        graph += `  subgraph configs [" ⚙️ CONFIGS "]\n`;
        Object.keys(state.configs || {}).forEach(name => {
            graph += `    cfg_${name}[/"📄 ${name}"/]:::config\n`;
        });
        graph += `  end\n\n`;
    }

    // Generate relationships with styled edges
    let edgeIndex = 0;
    const dependsOnEdges = [];
    const networkEdges = [];
    const volumeEdges = [];
    const secretEdges = [];
    const configEdges = [];

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

        // Secrets connections (purple dotted)
        normalizeArray(svc.secrets).forEach(sec => {
            const secName = typeof sec === 'string' ? sec : sec?.source;
            if (secName && state.secrets && state.secrets[secName]) {
                graph += `  sec_${secName} -.-> ${name}\n`;
                secretEdges.push(edgeIndex++);
            }
        });

        // Configs connections (cyan dotted)
        normalizeArray(svc.configs).forEach(cfg => {
            const cfgName = typeof cfg === 'string' ? cfg : cfg?.source;
            if (cfgName && state.configs && state.configs[cfgName]) {
                graph += `  cfg_${cfgName} -.-> ${name}\n`;
                configEdges.push(edgeIndex++);
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
    if (secretEdges.length > 0) {
        graph += `  linkStyle ${secretEdges.join(',')} stroke:#a855f7,stroke-width:2px,stroke-dasharray:3\n`;
    }
    if (configEdges.length > 0) {
        graph += `  linkStyle ${configEdges.join(',')} stroke:#06b6d4,stroke-width:2px,stroke-dasharray:3\n`;
    }

    return graph;
};

// Project colors for multi-project view
const PROJECT_COLORS = [
    { bg: '#1e3a8a', stroke: '#3b82f6', name: 'blue' },   // Blue
    { bg: '#065f46', stroke: '#10b981', name: 'green' },  // Green
    { bg: '#7c2d12', stroke: '#f97316', name: 'orange' }, // Orange
];

/**
 * Generates a Mermaid flowchart for multiple projects.
 * @param {Array<{id: string, name: string, content: object}>} projects - Array of projects
 * @param {Array} conflicts - Array of conflict results from comparison
 * @returns {string} The Mermaid graph definition
 */
export const generateMultiProjectGraph = (projects, conflicts = []) => {
    if (!projects || projects.length === 0) {
        return 'flowchart TB\n  empty["No projects loaded"]';
    }

    let graph = `flowchart LR\n`;

    // Class definitions for each project
    projects.forEach((project, idx) => {
        const color = PROJECT_COLORS[idx % PROJECT_COLORS.length];
        graph += `  classDef project${idx} fill:${color.bg},stroke:${color.stroke},stroke-width:2px,color:#fff,rx:8,ry:8\n`;
    });

    // Conflict highlighting
    graph += `  classDef conflict fill:#991b1b,stroke:#ef4444,stroke-width:3px,color:#fff\n`;
    graph += `  classDef shared fill:#4c1d95,stroke:#a78bfa,stroke-width:2px,color:#fff,stroke-dasharray:5\n`;
    graph += `  classDef network fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff\n`;
    graph += `  classDef volume fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fff\n`;
    graph += `\n`;

    // Build conflict lookup for quick access
    const conflictPorts = new Set();
    const conflictContainers = new Set();
    const sharedNetworks = new Set();

    conflicts.forEach(c => {
        if (c.category === 'port' && c.type === 'conflict') {
            c.details?.forEach(d => conflictPorts.add(`${d.project}:${d.service}`));
        }
        if (c.category === 'container_name' && c.type === 'conflict') {
            c.details?.forEach(d => conflictContainers.add(`${d.project}:${d.service}`));
        }
        if (c.category === 'network' && c.type === 'shared') {
            sharedNetworks.add(c.details?.networkName);
        }
    });

    // Collect all networks and volumes across projects for shared rendering
    const allNetworks = new Map(); // networkName -> [projectIdx]
    const allVolumes = new Map(); // volumeName -> [projectIdx]

    projects.forEach((project, idx) => {
        const content = project.content || {};
        Object.keys(content.networks || {}).forEach(netName => {
            if (!allNetworks.has(netName)) allNetworks.set(netName, []);
            allNetworks.get(netName).push(idx);
        });
        Object.keys(content.volumes || {}).forEach(volName => {
            if (!allVolumes.has(volName)) allVolumes.set(volName, []);
            allVolumes.get(volName).push(idx);
        });
    });

    // Render each project as a subgraph
    projects.forEach((project, idx) => {
        const content = project.content || {};
        const projectPrefix = `p${idx}_`;
        const emoji = ['🔵', '🟢', '🟠'][idx % 3];

        graph += `  subgraph ${projectPrefix}main ["${emoji} ${project.name || 'Project ' + (idx + 1)}"]\n`;
        graph += `    direction TB\n`;

        // Services
        Object.entries(content.services || {}).forEach(([serviceName, svc]) => {
            const nodeId = `${projectPrefix}${serviceName}`;
            const img = svc.image ? svc.image.split(':')[0] : 'build';
            const portsArr = normalizeArray(svc.ports);
            const portLabel = portsArr.length > 0 ? `<br/><small>🔌 ${portsArr[0]}</small>` : '';

            // Check if this service has conflicts
            const serviceKey = `${project.name}:${serviceName}`;
            const hasConflict = conflictPorts.has(serviceKey) || conflictContainers.has(serviceKey);
            const nodeClass = hasConflict ? 'conflict' : `project${idx}`;

            graph += `    ${nodeId}["<b>${serviceName}</b><br/><small>${img}</small>${portLabel}"]:::${nodeClass}\n`;
        });

        graph += `  end\n\n`;
    });

    // Render shared networks (outside project subgraphs)
    const sharedNetworksList = [...allNetworks.entries()].filter(([_, projs]) => projs.length > 1);
    if (sharedNetworksList.length > 0) {
        graph += `  subgraph shared_infra [" 🌐 SHARED NETWORKS "]\n`;
        sharedNetworksList.forEach(([netName, _]) => {
            graph += `    shared_net_${netName}(("${netName}")):::shared\n`;
        });
        graph += `  end\n\n`;
    }

    // Edge connections for shared networks
    let edgeIdx = 0;
    const sharedEdges = [];

    projects.forEach((project, idx) => {
        const content = project.content || {};
        const projectPrefix = `p${idx}_`;

        Object.entries(content.services || {}).forEach(([serviceName, svc]) => {
            normalizeArray(svc.networks).forEach(netName => {
                if (allNetworks.get(netName)?.length > 1) {
                    // Connect to shared network
                    graph += `  ${projectPrefix}${serviceName} -.-> shared_net_${netName}\n`;
                    sharedEdges.push(edgeIdx++);
                }
            });
        });
    });

    // Style shared edges
    if (sharedEdges.length > 0) {
        graph += `  linkStyle ${sharedEdges.join(',')} stroke:#a78bfa,stroke-width:2px,stroke-dasharray:5\n`;
    }

    return graph;
};
