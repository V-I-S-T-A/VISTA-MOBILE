const test=require('node:test');
const assert=require('node:assert/strict');
const {QueryClient,QueryObserver}=require('@tanstack/react-query');
const {createHarness,nodes}=require('./helpers/mobileComponentHarness.cjs');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};

test('screen query lifecycle keeps one cold skeleton, reuses valid cache and retains content through background errors',async()=>{
  const requests=[];
  const h=createHarness({
    '@tanstack/react-query':{QueryClient,useQuery:options=>options},
    '../context/AuthContext':{useAuth:()=>({user:{user_id:'isolated-cache-user'}})},
    '../services/submissionsService':{submissionsService:{listSubmissions:()=>{const request=deferred();requests.push(request);return request.promise;}}},
  });
  const client=h.load('src/lib/queryClient.js').queryClient;
  const options=h.instance(()=>h.load('src/hooks/useSubmissions.js').useSubmissions({page:1})).output;
  const first=new QueryObserver(client,options),states=[];
  const unsubscribe=first.subscribe(state=>states.push(state));
  assert.equal(first.getCurrentResult().isLoading,true);
  await tick();assert.equal(requests.length,1);
  assert.equal(first.getCurrentResult().isLoading,true,'A slow response retains the same cold loading state');
  const data={results:[{submission_id:'fixture',title:'Cached submission'}],count:1};
  requests[0].resolve(data);await tick();
  assert.equal(first.getCurrentResult().data,data);
  const visited=new QueryObserver(client,options),stopVisited=visited.subscribe(()=>{});
  await tick();assert.equal(requests.length,1,'A visited screen with fresh cache does not refetch');
  assert.equal(visited.getCurrentResult().data,data);assert.equal(visited.getCurrentResult().isLoading,false);
  const refresh=client.invalidateQueries({queryKey:['submissions']});await tick();
  assert.equal(requests.length,2);assert.equal(first.getCurrentResult().isFetching,true);
  assert.equal(first.getCurrentResult().isLoading,false);assert.equal(first.getCurrentResult().data,data,'Background work never replaces content with a skeleton');
  requests[1].reject(Object.assign(new Error('isolated offline fixture'),{code:'ERR_NETWORK'}));await refresh;await tick();
  assert.equal(first.getCurrentResult().isError,true);assert.equal(first.getCurrentResult().data,data);
  assert.equal(first.getCurrentResult().isFetching,false,'A failed refresh settles instead of hanging');
  assert.equal(states.filter(s=>s.isLoading).length>=1,true);
  stopVisited();unsubscribe();client.clear();
});

test('an uncached request failure settles into the existing retry UI; stale data keeps its list visible',()=>{
  const h=createHarness();
  const List=h.load('src/screens/staff/reviewPanel/StaffReviewList.jsx').default;
  let retries=0;
  const view=h.instance(List,{submissions:[],isLoading:true,onRetry:()=>retries++});
  assert.equal(nodes(view.output).some(n=>n.type?.name==='SubmissionListSkeleton'),true);
  view.render({...view.props,isLoading:false,isError:true,error:{status:503}});
  assert.equal(nodes(view.output).some(n=>n.type?.name==='SubmissionListSkeleton'),false);
  const errorState=nodes(view.output).find(n=>n.type?.name==='ContentState');
  assert.equal(errorState.props.variant,'error');
  assert.equal(errorState.props.title,'Could not load submissions');
  const content=h.instance(errorState.type,errorState.props).output;
  nodes(content).find(n=>n.props?.label==='Try again').props.onPress();assert.equal(retries,1);
  view.render({...view.props,submissions:[{submission_id:'fixture',title:'Cached'}]});
  assert.equal(nodes(view.output).some(n=>n.type?.name==='SubmissionListCard'),true);
  assert.equal(nodes(view.output).some(n=>n.type?.name==='StaleWarningBanner'),true);
});
