"""Delete an active sync graph and prove its SSE/runtime resources close."""
import argparse
import http.client
import json
from pathlib import Path
import subprocess

from graph_deletion_lifecycle_test import CLI, alive, until, lifecycle_info

parser = argparse.ArgumentParser()
parser.add_argument('--root-dir', required=True)
parser.add_argument('--config', required=True)
parser.add_argument('--other-root', required=True)
parser.add_argument('--other-config', required=True)
parser.add_argument('--graph', required=True)
args = parser.parse_args()


def invoke(root, config, *command):
    result = subprocess.run(['node', str(CLI), '--root-dir', root, '--config', config,
                             '--graph', args.graph, '--output', 'json', *command],
                            capture_output=True, text=True, timeout=30)
    assert result.returncode == 0, result.stdout + result.stderr
    return json.loads(result.stdout)


status = invoke(args.root_dir, args.config, 'sync', 'status')
assert status['data']['ws-state'] == 'open', status
root = Path(args.root_dir)
graph_dir = root / 'graphs' / args.graph
info = lifecycle_info(root, args.graph)
lock = info['state']['workers'][0]
entry = next(line.split() for line in (root / 'server-list').read_text().splitlines()
             if int(line.split()[0]) == lock['pid'])
connection = http.client.HTTPConnection('127.0.0.1', int(entry[1]), timeout=10)
connection.request('GET', '/v1/events')
response = connection.getresponse()
assert response.status == 200
assert response.read(1) == b'\n'
try:
    invoke(args.root_dir, args.config, 'graph', 'remove')
    response.read()  # EOF, rather than a timeout, proves the open SSE connection closed.
finally:
    connection.close()
until(lambda: not alive(lock['pid']))
assert not graph_dir.exists()
assert not any(line.split()[0] == str(lock['pid'])
               for line in (root / 'server-list').read_text().splitlines())
moved = root / 'graphs' / 'Unlinked graphs' / args.graph
assert (moved / 'db.sqlite').exists()
assert Path(info['ownership']).exists()
peer = invoke(args.other_root, args.other_config, 'sync', 'status')
assert peer['data']['ws-state'] == 'open', peer
peer['data']['deleted-worker-pid'] = lock['pid']
print(json.dumps(peer))
