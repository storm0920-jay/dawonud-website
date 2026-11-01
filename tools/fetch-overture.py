# Overture Maps 구역 자르기: python3 tools/fetch-overture.py base water out.parquet xmin,ymin,xmax,ymax
# (pyarrow, fsspec, aiohttp 필요) 지도용: base water / base land_use / transportation segment / buildings building(여의도만)
import sys, fsspec, pyarrow.parquet as pq, pyarrow as pa, re, subprocess
theme, typ, out = sys.argv[1], sys.argv[2], sys.argv[3]
X0,Y0,X1,Y1 = map(float, sys.argv[4].split(','))
R='release/2026-10-21.0'; B='https://overturemaps-us-west-2.s3.amazonaws.com/'
lst=subprocess.run(['curl','-s',f'{B}?list-type=2&prefix={R}/theme={theme}/type={typ}/'],capture_output=True,text=True).stdout
keys=re.findall(r'<Key>([^<]*parquet)',lst)
fs=fsspec.filesystem('http',client_kwargs={'trust_env':True},block_size=2**20)
tables=[]
for k in keys:
  f=pq.ParquetFile(fs.open(B+k))
  md=f.metadata; names=md.schema.names
  idx={n:i for i,n in enumerate(f.schema_arrow.names)}
  # leaf columns: find bbox stats by path
  cols={md.row_group(0).column(j).path_in_schema:j for j in range(md.num_columns)}
  rgs=[]
  for r in range(md.num_row_groups):
    rg=md.row_group(r)
    def st(p): s=rg.column(cols[p]).statistics; return s.min,s.max
    xmin=st('bbox.xmin'); xmax=st('bbox.xmax'); ymin=st('bbox.ymin'); ymax=st('bbox.ymax')
    if xmin[0]<=X1 and xmax[1]>=X0 and ymin[0]<=Y1 and ymax[1]>=Y0: rgs.append(r)
  print(k[-50:],md.num_row_groups,len(rgs),flush=True)
  if rgs:
    t=f.read_row_groups(rgs)
    b=t.column('bbox').combine_chunks()
    import pyarrow.compute as pc
    m=pc.and_(pc.and_(pc.less_equal(b.field('xmin'),X1),pc.greater_equal(b.field('xmax'),X0)),pc.and_(pc.less_equal(b.field('ymin'),Y1),pc.greater_equal(b.field('ymax'),Y0)))
    t=t.filter(m); print(' rows',t.num_rows,flush=True)
    if t.num_rows: tables.append(t)
pq.write_table(pa.concat_tables(tables,promote_options='permissive'),out)
