/**
 * Utility for resolving service icons.
 * Auto-discovers SVG icons from the services folder with emoji fallbacks.
 */

// Dynamically import ALL SVG icons from the services folder
const iconModules = import.meta.glob('../assets/icons/services/*.svg', { eager: true, as: 'url' });

// Build a mapping from filename (without extension) to the SVG URL
const svgIcons = {};
for (const path in iconModules) {
    // Extract filename without extension: '../assets/icons/services/postgresql.svg' -> 'postgresql'
    const filename = path.split('/').pop().replace('.svg', '').toLowerCase();
    svgIcons[filename] = iconModules[path];
}

// Debug: log discovered SVG icons
console.log('[iconUtils] Discovered SVG icons:', Object.keys(svgIcons));

// Emoji fallback mapping
const emojiIcons = {
    redis: '🔴',
    postgres: '🐘',
    postgresql: '🐘',
    mysql: '🐬',
    mongodb: '🍃',
    mongo: '🍃',
    nginx: '⚡',
    node: '💚',
    python: '🐍',
    rabbitmq: '🐰',
    go: '🔵',
    golang: '🔵',
    php: '🐘',
    apache: '🪶',
    httpd: '🪶',
    rust: '🦀',
    docker: '🐋',
    mariadb: '🐬',
    elasticsearch: '🔍',
    kibana: '📊',
    grafana: '📈',
    prometheus: '🔥',
    traefik: '🚦',
    caddy: '🔒',
    memcached: '🧠',
    java: '☕',
    dotnet: '🟣',
    ruby: '💎',
    perl: '🐪',
};

/**
 * Get the icon for a service.
 * Returns an object with type ('svg' or 'emoji') and the value.
 * @param {string} name - Service name or template key.
 * @param {string} image - Optional Docker image name for pattern matching.
 * @returns {{ type: 'svg' | 'emoji', value: string }}
 */
export const getServiceIcon = (name, image) => {
    const lowerName = name?.toLowerCase() || '';
    const lowerImage = image?.toLowerCase() || '';

    // Helper to check patterns - bidirectional matching
    const matches = (pattern) =>
        lowerName.includes(pattern) ||
        lowerImage.includes(pattern) ||
        pattern.includes(lowerName) ||
        pattern.includes(lowerImage.split(':')[0]); // Match image name without tag

    // 1. Check for SVG icons first (direct match by name)
    if (svgIcons[lowerName]) {
        return { type: 'svg', value: svgIcons[lowerName] };
    }

    // 2. Pattern matching in name/image for SVGs
    for (const key in svgIcons) {
        if (matches(key)) {
            return { type: 'svg', value: svgIcons[key] };
        }
    }

    // 3. Direct emoji match
    if (emojiIcons[lowerName]) {
        return { type: 'emoji', value: emojiIcons[lowerName] };
    }

    // 4. Pattern matching for emojis
    for (const key in emojiIcons) {
        if (matches(key)) {
            return { type: 'emoji', value: emojiIcons[key] };
        }
    }

    // 5. Fallback
    return { type: 'emoji', value: '📦' };
};

/**
 * Get emoji icon for a service (for text-based contexts like Graphviz)
 * @param {string} name - Service name
 * @param {string} image - Docker image name
 * @returns {string} Emoji character
 */
export const getServiceEmoji = (name, image) => {
    const lowerName = name?.toLowerCase() || '';
    const lowerImage = image?.toLowerCase() || '';
    const matches = (pattern) => lowerName.includes(pattern) || lowerImage.includes(pattern);

    // Pattern matching for emojis
    if (matches('postgres')) return '🐘';
    if (matches('mysql') || matches('mariadb')) return '🐬';
    if (matches('mongo')) return '🍃';
    if (matches('redis')) return '🔴';
    if (matches('nginx')) return '⚡';
    if (matches('node')) return '💚';
    if (matches('python')) return '🐍';
    if (matches('rabbit')) return '🐰';
    if (matches('go') || matches('golang')) return '🔵';
    if (matches('php')) return '🐘';
    if (matches('apache') || matches('httpd')) return '🪶';
    if (matches('rust')) return '🦀';
    if (matches('docker')) return '🐋';
    if (matches('elasticsearch')) return '🔍';
    if (matches('kibana')) return '📊';
    if (matches('grafana')) return '📈';
    if (matches('prometheus')) return '🔥';
    if (matches('traefik')) return '🚦';
    if (matches('caddy')) return '🔒';
    if (matches('memcached')) return '🧠';
    if (matches('java')) return '☕';
    if (matches('dotnet')) return '🟣';
    if (matches('ruby')) return '💎';
    if (matches('kafka')) return '📨';
    if (matches('minio')) return '📦';
    if (matches('consul')) return '🔧';
    if (matches('vault')) return '🔐';
    if (matches('zookeeper')) return '🦓';
    if (matches('influx')) return '📉';
    if (matches('haproxy')) return '⚖️';
    if (matches('envoy')) return '🌐';
    if (matches('kong')) return '🦍';

    return '📦';
};

/**
 * React component helper to render the icon
 * @param {{ type: 'svg' | 'emoji', value: string }} iconData
 * @param {string} className - Optional class for styling
 * @returns {JSX.Element}
 */
export const renderServiceIcon = (iconData, className = '') => {
    if (iconData.type === 'svg') {
        return <img src={iconData.value} alt="service icon" className={className} style={{ width: '1.2em', height: '1.2em', display: 'inline-block', verticalAlign: 'middle' }} />;
    }
    return <span className={className}>{iconData.value}</span>;
};
