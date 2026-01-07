import { Lock, Tag } from 'lucide-react';
import { Input, Checkbox, KeyValueEditor, Section } from './PanelUI';

/**
 * Secret configuration panel
 */
export const SecretConfig = ({ data, update }) => (
    <div className="config-sections">
        <Section title="Configuration" icon={Lock} defaultOpen={true}>
            <Input
                label="File Path"
                value={data.file}
                onChange={(v) => update('file', v)}
                placeholder="./secrets/my-secret.txt"
                tooltip="Path to the secret file"
            />
            <Input
                label="External Name"
                value={data.name}
                onChange={(v) => update('name', v)}
                placeholder="external-secret-name"
                tooltip="External secret name"
            />
            <Checkbox
                label="External Secret"
                checked={data.external}
                onChange={(v) => update('external', v)}
                tooltip="Use pre-existing secret"
            />
        </Section>

        <Section title="Labels" icon={Tag}>
            <KeyValueEditor
                label="Secret Labels"
                value={data.labels}
                onChange={(v) => update('labels', v)}
                keyPlaceholder="label.key"
                valuePlaceholder="value"
                tooltip="Labels to add to the secret"
            />
        </Section>
    </div>
);

export default SecretConfig;
