#!/usr/bin/env python3
"""Extrai rascunhos didaticos do RizoWiki 1.0 para curadoria.

Uso:
    python scripts/extract_from_1_0.py --source /caminho/para/RizoWiki-1.0

Este script nao promove nenhum valor do 1.0 a parametro final.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import OrderedDict
from pathlib import Path


def load_window_js(path: Path, varname: str) -> OrderedDict:
    text = path.read_text(encoding="utf-8")
    match = re.search(r"window\." + re.escape(varname) + r"\s*=\s*", text)
    if not match:
        raise ValueError(f"Nao encontrei window.{varname} em {path}")
    body = text[match.end():].strip()
    if body.endswith(";"):
        body = body[:-1]
    return json.loads(body, object_pairs_hook=OrderedDict)


def marker() -> OrderedDict:
    return OrderedDict([
        ("status", "pendente_revisao"),
        ("draft_type", "rascunho_didatico"),
        ("confidence", "baixa"),
        ("source", "RizoWiki 1.0"),
    ])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, help="Checkout local do RizoWiki 1.0")
    args = parser.parse_args()

    source = Path(args.source)
    bio = load_window_js(source / "assets" / "data" / "bioData.js", "bioData")
    lab = load_window_js(source / "assets" / "data" / "bioDataLab.js", "bioDataLab")

    if "mycorrhiza" in lab and "micorrizas" not in lab:
        lab["micorrizas"] = lab.pop("mycorrhiza")

    organisms = OrderedDict()
    for organism_id, entry in bio.items():
        item = marker()
        item.update(OrderedDict([
            ("label", entry.get("name")),
            ("raw_bioData", entry),
            ("raw_bioDataLab", lab.get(organism_id)),
            ("review_warning", "Rascunho didatico. Nao usar como parametro final."),
        ]))
        organisms[organism_id] = item

    rules = []
    for organism_id, entry in bio.items():
        compat = ((entry.get("extension") or {}).get("compatibilidadePratica") or {})
        if compat:
            item = marker()
            item.update(OrderedDict([
                ("organism", organism_id),
                ("raw_compatibilidadePratica", compat),
                ("condition", None),
                ("effect", None),
                ("message", None),
            ]))
            rules.append(item)

    out_dir = Path(__file__).resolve().parents[1] / "src" / "data" / "raw"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "organisms_raw_from_1_0.json").write_text(
        json.dumps({"_meta": marker(), "organisms": organisms}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (out_dir / "compatibility_rules_raw_from_1_0.json").write_text(
        json.dumps({"_meta": marker(), "rules": rules}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
