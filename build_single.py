# Ek single-file banata hai (hosting/preview ke liye): python3 build_single.py -> chrono_single.html
import re
h=open('index.html',encoding='utf-8').read()
h=h.replace('<link rel="stylesheet" href="style.css">','<style>\n'+open('style.css',encoding='utf-8').read()+'</style>')
h=h.replace('<script src="app.js"></script>','<script>\n'+open('app.js',encoding='utf-8').read()+'</script>')
open('chrono_single.html','w',encoding='utf-8').write(h)
