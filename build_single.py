# Ek single-file banata hai (hosting/preview ke liye): python3 build_single.py -> chrono_single.html
import re
h=open('index.html',encoding='utf-8').read()
h=re.sub(r'<link rel="stylesheet" href="(style|extras)\.css">',lambda m:'<style>\n'+open(m.group(1)+'.css',encoding='utf-8').read()+'</style>',h)
h=h.replace('<script src="app.js"></script>','<script>\n'+open('app.js',encoding='utf-8').read()+'</script>')
open('chrono_single.html','w',encoding='utf-8').write(h)
