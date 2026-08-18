def escape_like(s):
    if not s:
        return ''
    return s.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')