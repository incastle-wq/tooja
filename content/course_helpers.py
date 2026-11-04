def mc(q, o, e=''): return {'k': 'mc', 'q': q, 'o': o, 'e': e}
def ox(q, ans, e=''): return {'k': 'mc', 'q': q, 'o': ['O (맞다)', 'X (틀리다)'] if ans else ['X (틀리다)', 'O (맞다)'], 'e': e, 'ox': 1}
def calc(q, ans, unit='', e='', dp=2, tol=None, f=''):
    d = {'k': 'calc', 'q': q, 'ans': round(ans, 6), 'unit': unit, 'e': e, 'dp': dp, 'f': f}
    d['tol'] = tol if tol is not None else max(abs(ans) * 0.006, 0.5 * 10 ** (-dp) + 1e-9)
    return d
def card(h, p, f=None, calc=None):
    d = {'h': h, 'p': p}
    if f: d['f'] = f
    if calc: d['calc'] = calc
    return d
def imp(*a): return list(a)
def case_card(t, p, k): return {'h': t, 'p': p, 'f': k, 'case': 1}
