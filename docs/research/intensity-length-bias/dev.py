import json,sys,statistics as st
d=json.load(open('dev.json'))
L=[r[0] for r in d]; I=[r[1] for r in d]
def rank(x):
    s=sorted(range(len(x)),key=lambda i:x[i]); r=[0]*len(x); i=0
    while i<len(s):
        j=i
        while j+1<len(s) and x[s[j+1]]==x[s[i]]: j+=1
        for k in range(i,j+1): r[s[k]]=(i+j)/2
        i=j+1
    return r
def corr(a,b):
    ma,mb=st.mean(a),st.mean(b)
    return sum((x-ma)*(y-mb) for x,y in zip(a,b))/(sum((x-ma)**2 for x in a)*sum((y-mb)**2 for y in b))**.5
print("n",len(d),"spearman",round(corr(rank(L),rank(I)),3))
for lo,hi in [(0,40),(40,100),(100,200),(200,1000)]:
    xs=[i for l,i in zip(L,I) if lo<=l<hi]; print(f"{lo}-{hi}: n={len(xs)} mean={st.mean(xs):.2f}")
print("max len",max(L))
