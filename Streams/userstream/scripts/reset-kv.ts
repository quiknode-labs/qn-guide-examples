import 'dotenv/config';

const QN_API_KEY = process.env.QN_API_KEY;

if (!QN_API_KEY) {
    console.error('Error: QN_API_KEY is not defined in environment variables.');
    process.exit(1);
}

const LIST_KEYS = [
    'userstream_monitored_users_evm',
    'userstream_monitored_users_sol',
];

async function deleteList(key: string) {
    console.log(`Deleting KV Store list: ${key}...`);
    try {
        const response = await fetch(
            `https://api.quicknode.com/kv/rest/v1/lists/${key}`,
            {
                method: 'DELETE',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                    'x-api-key': QN_API_KEY!,
                },
            }
        );

        if (response.status === 200 || response.status === 404) {
            console.log(`Successfully deleted (or not found) list: ${key}`);
        } else {
            const data = await response.json();
            console.error(`Failed to delete list ${key}:`, data);
        }
    } catch (error) {
        console.error(`Error deleting list ${key}:`, error);
    }
}

async function main() {
    console.log('Starting KV Store reset...');
    for (const key of LIST_KEYS) {
        await deleteList(key);
    }
    console.log('KV Store reset complete.');
}

main();
