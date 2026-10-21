# Copyright (c) 2026, SIJIL and contributors
# License: MIT. See license.txt

from sijil.services import reports


def execute(filters=None):
	return reports.REPORTS["stale_cases"][1](filters or {})
