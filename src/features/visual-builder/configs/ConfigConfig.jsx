import { Settings, Tag } from 'lucide-react';
import { Input, Checkbox, KeyValueEditor, Section } from './PanelUI';

/**
 * Config file configuration panel
 */
export const ConfigConfig = ({ data, update }) => (
    <div className="config-sections">
        <Section title="Configuration" icon={Settings} defaultOpen={true}>
            <Input
                label="File Path"
                value={data.file}
                onChange={(v) => update('file', v)}
                placeholder="./configs/my-config.conf"
                tooltip="Path to the config file"
            />
            <Input
                label="External Name"
                value={data.name}
                onChange={(v) => update('name', v)}
                placeholder="external-config-name"
                tooltip="External config name"
            />
            <Checkbox
                label="External Config"
                checked={data.external}
                onChange={(v) => update('external', v)}
                tooltip="Use pre-existing config"
            />
        </Section>

        <Section title="Labels" icon={Tag}>
            <KeyValueEditor
                label="Config Labels"
                value={data.labels}
                onChange={(v) => update('labels', v)}
                keyPlaceholder="label.key"
                valuePlaceholder="value"
                tooltip="Labels to add to the config"
            />
        </Section>
    </div>
);

export default ConfigConfig;
