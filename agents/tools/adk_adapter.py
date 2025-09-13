"""ADK adapter helpers.

These utilities convert methods annotated with @tool to a list useful for
constructing an ADK Agent. If future ADK versions require explicit Tool types,
this module can adapt methods accordingly without changing agent classes.
"""

from __future__ import annotations

from collections.abc import Callable, Iterable


def collect_tools(obj: object) -> list[Callable]:
    """Collect bound methods annotated with @tool from an object."""
    methods: list[Callable] = []
    for attr in dir(obj):
        if attr.startswith("_"):
            continue
        candidate = getattr(obj, attr)
        if callable(candidate) and getattr(candidate, "__is_tool__", False):
            methods.append(candidate)
    return methods


def ensure_tool_list(tools: Iterable[Callable] | None, obj: object) -> list[Callable]:
    if tools is not None:
        return list(tools)
    return collect_tools(obj)
