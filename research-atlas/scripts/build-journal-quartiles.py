"""Convert a POSI Citation Ranking CSV into compact same-origin ISSN indexes.

Download the ranked CSV and PSC taxonomy linked from the provider's data page:
https://posi.panorama-sg.com/datasets/. Supply the matching ranking manifest
linked on that page to retain the actual edition and indicator year.
"""

import argparse
import csv
import json
from pathlib import Path
import re


BUCKETS = 8
CATEGORY_KEYS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'


def normalize_issn(value):
    compact = value.strip().upper().replace('-', '')
    if not re.fullmatch(r'\d{7}[\dX]', compact):
        return None
    weighted = sum(int(digit) * weight for digit, weight in zip(compact[:7], range(8, 1, -1)))
    digit = (11 - weighted % 11) % 11
    return compact if compact[-1] == ('X' if digit == 10 else str(digit)) else None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv', type=Path)
    parser.add_argument('taxonomy', type=Path)
    parser.add_argument('manifest', type=Path)
    parser.add_argument('--output', type=Path, default=Path('public/data'))
    args = parser.parse_args()

    taxonomy = json.loads(args.taxonomy.read_text(encoding='utf-8-sig'))
    names = {category['code']: category['name'] for category in taxonomy['categories']}
    manifest = json.loads(args.manifest.read_text(encoding='utf-8-sig'))
    rows = {}
    ambiguous = set()
    with args.csv.open(encoding='utf-8-sig', newline='') as source:
        for entry in csv.DictReader(source):
            quartile, category = entry['citation_quartile'], entry['ranking_category_id']
            status = entry['citation_ranking_status']
            if quartile not in ('Q1', 'Q2', 'Q3', 'Q4') or status not in ('official', 'provisional'):
                continue
            if category not in names:
                raise ValueError(f'Missing subject in taxonomy: {category}')
            value = (entry['posi_id'], category, int(quartile[1]) + 4 * (status == 'provisional'))
            for alias in entry['issn'].split():
                issn = normalize_issn(alias)
                if issn is None:
                    continue
                if issn in rows and rows[issn] != value:
                    ambiguous.add(issn)
                rows[issn] = value

    for issn in ambiguous:
        rows.pop(issn)
    if not rows:
        raise ValueError('No usable quartiles were found.')

    categories = sorted({category for _, category, _ in rows.values()})
    if len(categories) > len(CATEGORY_KEYS):
        raise ValueError('The subject taxonomy exceeds the packed index capacity.')
    subject_keys = {category: CATEGORY_KEYS[index] for index, category in enumerate(categories)}
    buckets = [[] for _ in range(BUCKETS)]
    for issn, (_, category, rank) in sorted(rows.items()):
        bucket = sum(map(int, issn[:7])) % BUCKETS
        buckets[bucket].append(f'{issn}{subject_keys[category]}{rank}')

    args.output.mkdir(parents=True, exist_ok=True)
    for index, records in enumerate(buckets):
        # Each fixed-width entry uses eight ISSN characters, one subject key and one rank digit.
        data = {
            'source': 'POSI',
            'edition': manifest['edition'],
            'year': manifest['metric_year'],
            'snapshot': manifest['ranking_snapshot_date'],
            'categories': [names[category] for category in categories],
            'rows': ''.join(records),
        }
        path = args.output / f'journal-quartiles-{index}.json'
        path.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print(f'{len(rows):,} ISSNs, {len(ambiguous):,} ambiguous aliases omitted, {len(categories)} subject categories')


if __name__ == '__main__':
    main()
