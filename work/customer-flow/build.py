from pathlib import Path
import json, html, textwrap, base64

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'outputs/customer-flow'
OUT.mkdir(parents=True, exist_ok=True)
FLOWS=[]

def N(id,c,r,title,sub='',owner='Customer',kind='action',detail='',to='',status='Proposed UX',policy=''):
    return dict(id=id,c=c,r=r,title=title,sub=sub,owner=owner,kind=kind,detail=detail or sub,to=to,status=status,policy=policy)
def E(a,b,label='',route=''):
    return dict(a=a,b=b,label=label,route=route)
def F(id,title,intent,thought,nodes,edges,cases,note):
    FLOWS.append(dict(id=id,title=title,intent=intent,thought=thought,nodes=nodes,edges=edges,cases=cases,note=note))

F('overview','The complete customer journey','From a new resident to a completed collection, with partner and LAWMA handoffs.','“I want someone reliable to collect my waste, and to know what I am paying for.”',[
N('start',0,0,'Get the customer app','Apple App Store / Google Play',kind='start',to='access',status='Confirmed direction'),
N('account',1,0,'Sign in or create account','Verify phone; recover if needed',to='access'),
N('home',2,0,'Find / join a residence','One location; linked residents',to='residence',status='Confirmed direction'),
N('provider',3,0,'Choose a nearby partner','Eligible providers; your preference',to='providers',status='Confirmed direction'),
N('hub',3,1,'Your home in the app','Provider • bins • wallet • requests',kind='start',detail='Customers without a bin can reach this home screen, request a bin, track rollout and report issues. Personal wallets remain separate from shared household bins.'),
N('bin',2,1,'Request or view bins','Shared allocation; sizes / quantity',to='bins',status='Confirmed direction'),
N('stock',1,1,'LAWMA → partner → home','New IoT bins; custody + delivery',owner='Partner',to='bins',status='Confirmed direction'),
N('fund',3,2,'Top up your wallet','Transfer • card • supported USSD',to='wallet',status='Confirmed direction'),
N('request',2,2,'Request a pickup','Show price; authorize payment',to='booking',detail='An active IoT bin is not silently made a universal booking prerequisite. Interim pickup availability is an open policy. Wallet setup can happen independently of bin fulfilment.'),
N('accept',1,2,'Partner accepts request','Automatic payment is triggered',owner='Partner',to='booking',status='Confirmed direction'),
N('collect',0,2,'Track the collection','Scheduled → on the way → collected',to='collection'),
N('finish',0,3,'View receipt & outcome','Confirm or report a problem',kind='end',to='collection'),
N('support',1,3,'Get help / resolve a case','Partner response → LAWMA escalation',to='support'),
N('manage',2,3,'Manage home & service','Members • move • switch • bin care',to='lifecycle'),
N('oversight',3,3,'LAWMA oversight','Rollout, service and exceptions',owner='LAWMA',detail='LAWMA receives role-appropriate linked records across customer, partner, bin, booking and payment. Individual payment details are not public household data.',status='Confirmed direction'),
],[E('start','account'),E('account','home'),E('home','provider'),E('provider','hub'),E('hub','bin','Bins'),E('bin','stock','Fulfilment'),E('hub','fund','Wallet'),E('fund','request','Ready to book'),E('request','accept','Request + amount'),E('accept','collect','Accepted'),E('collect','finish'),E('finish','support','Issue?'),E('support','manage','Return to home'),E('manage','oversight','Relevant records')],
['New and returning customers use a standalone native mobile app.','Onboarding remains available while bins are unavailable or not yet distributed.','Residents share a premise allocation; each customer retains their own wallet.','Customers choose among eligible nearby providers.','LAWMA issues new IoT bin stock to partners for delivery.','Acceptance triggers automatic payment; collection completion remains a separate event.','Customer, partner and LAWMA see the same linked service status.'],
'Bins and wallet setup are independent branches. The arrows show the principal journey; detailed maps below include waiting, decline, retry and recovery paths.')

F('access','01 / Access & account recovery','Enter the native app with a verified identity and a usable recovery route.','“Let me get started without asking for everything at once.”',[
N('open',0,0,'Install & open app','Welcome; language / accessibility',kind='start',status='Confirmed direction'),
N('existing',1,0,'Existing account?',kind='decision'),
N('new',2,0,'Create an account','Name, phone; clear terms'),
N('return',1,1,'Sign in securely','Verified phone; biometric if enabled'),
N('otp',2,1,'Verify your phone','One-time code; expiry shown'),
N('valid',2,2,'Code valid?',kind='decision'),
N('failed',3,2,'Code not received / expired','Resend timer; change number; help',detail='Preserve entered information. Rate-limit resends and explain the wait. Offer an approved recovery route; do not reveal whether an unrelated phone belongs to a customer.'),
N('lost',0,1,'Lost phone / locked out','Start identity recovery',detail='Recovery must verify identity. Do not transfer a wallet or household-admin role based only on a new phone number.'),
N('review',0,2,'Recovery under review','Reference + status; support route',owner='Platform',policy='P02'),
N('verified',1,2,'Access restored','Resume account; device controls',kind='end'),
N('permissions',2,3,'Optional app permissions','Location / push: allow or skip',detail='Ask in context. Manual address entry works without location permission. The in-app activity inbox works without push.'),
N('continue',2,4,'Continue to your residence','Resume setup or existing home',kind='end',to='residence'),
N('offline',3,3,'Connection interrupted','Keep draft; show offline state',detail='Saved locally is not submitted. Retry after reconnection. Never show authentication or a payment as successful without confirmation.'),
],[E('open','existing'),E('existing','new','No'),E('existing','return','Yes'),E('new','otp'),E('return','otp','Verify if required'),E('return','lost','Cannot sign in'),E('lost','review'),E('review','verified','Approved'),E('verified','permissions','Continue'),E('otp','valid'),E('valid','failed','No'),E('valid','permissions','Yes'),E('permissions','continue'),E('permissions','offline','No connection')],
['New account; existing account; resume unfinished onboarding.','Wrong, expired or undelivered OTP; controlled resend and correction.','Lost phone, changed number, locked account or unrecognized device.','Location permission denied: enter an address manually.','Push permission denied: in-app updates remain available.','Offline interruption: preserve the form and show unsent status.','Optional biometrics and language preference; accessible error text.'],
'Wallet identity checks are a separate, progressive step in flow 05. They do not block reporting or requesting a bin.')

F('residence','02 / Residence & shared household','Find one service location and prevent duplicate bin allocation without excluding tenants.','“Someone in my compound may already have registered this house.”',[
N('address',0,0,'Find your residence','Address, landmark, map or reference',kind='start'),
N('match',1,0,'Location found?',kind='decision'),
N('confirm',2,0,'Confirm the right property','House / compound / verified unit',detail='Close map pins or similar street names are only possible matches. A review establishes whether the same compound or genuinely separate service unit is being described.',policy='P01'),
N('new',0,1,'Submit missing address','Map pin + description; save draft'),
N('review',0,2,'Location verification','Partner / LAWMA resolves ambiguity',owner='LAWMA',policy='P01'),
N('member',2,1,'Already linked here?',kind='decision'),
N('join',3,1,'Request household access','Invite / code / reviewed residency',policy='P02'),
N('role',2,2,'Confirm your role','Tenant, owner or authorized contact',detail='Being a renter does not exclude a person. Household permissions determine who can request shared bins or change the provider; other residents retain their personal wallet.'),
N('approved',3,2,'Membership verified?',kind='decision'),
N('dispute',3,3,'Access disputed / pending','Private review; status + reference',owner='Platform',detail='Do not disclose another resident’s identity or wallet. Allow a disputed address claim to be reviewed without creating a second allocation.'),
N('allocation',2,3,'View shared service record','Current partner, bins and requests',detail='Show existing allocation or request to authorized members. An additional bin is a change to this record, not a new property registration.',status='Confirmed direction'),
N('next',2,4,'Set up / resume service','Choose partner or open your home',kind='end',to='providers'),
N('outside',0,3,'Outside current rollout','Register interest; support available',detail='Keep the account usable. Explain unavailable services and notify when coverage opens. Do not promise a delivery date.',policy='P05'),
],[E('address','match'),E('match','confirm','Yes'),E('match','new','No'),E('new','review'),E('review','role','Verified'),E('review','outside','Not yet covered'),E('confirm','member'),E('member','join','Yes / exists'),E('member','role','New household'),E('join','approved'),E('approved','allocation','Yes'),E('approved','dispute','No / pending'),E('role','allocation'),E('allocation','next')],
['First resident registers a property; another tenant joins the same property.','Existing bin or open bin request found: reuse the shared record.','Similar address, shared entrance or map-pin collision: verify before merging.','Distinct flats/units in one building: boundary policy decides separate service locations.','No formal street address: landmark and assisted verification.','Tenant, landlord and caretaker permissions; membership dispute or inaccessible contact.','Outside rollout area: register interest and access help.','Multiple residences are separate service locations; never reuse their bin entitlement.'],
'A household can have several approved bins. “One allocation per residence” never means “exactly one bin for every building.”')

F('providers','03 / Discover & choose a provider','Compare nearby partners who are permitted and available to serve the residence.','“Who can collect here, when can they come, and what will it cost?”',[
N('location',0,0,'Use confirmed residence','Keep map/address visible',kind='start'),
N('eligible',1,0,'Eligible partners?',kind='decision'),
N('compare',2,0,'Compare nearby providers','Distance, availability, price, service',status='Confirmed direction',detail='Proximity is a sort order after eligibility. Present verified performance if available; do not invent ratings. Display bin rollout availability separately from pickup capacity.'),
N('profile',3,0,'View partner profile','Coverage, schedule, terms, contact'),
N('none',1,1,'No provider available','Waitlist / service-area help',detail='Keep the residence and bin enquiry. Explain why no choice is available and request an update when coverage or capacity changes.'),
N('choose',3,1,'Select your provider','Confirm residence and service terms',status='Confirmed direction'),
N('ready',3,2,'Selection confirmed?',kind='decision',policy='P03'),
N('pending',2,2,'Confirmation pending','Partner capacity / territory review',owner='Partner',detail='If LAWMA requires onboarding approval, show it explicitly. This membership/selection event is not a paid pickup acceptance.'),
N('retry',2,3,'Declined / unavailable','Choose another eligible partner',to='providers'),
N('active',3,3,'Provider linked to home','Request bins or book when eligible',kind='end',to='bins'),
N('switch',0,2,'Want to change provider?','Review open work and shared service',to='lifecycle',detail='A provider change applies to the shared location. A resident cannot silently override the household service contact.'),
],[E('location','eligible'),E('eligible','compare','Yes'),E('eligible','none','No'),E('compare','profile'),E('profile','choose'),E('choose','ready'),E('ready','active','Yes'),E('ready','pending','Review needed'),E('pending','retry','Declined'),E('pending','active','Approved')],
['One eligible partner, several choices or no service coverage.','Nearby but outside the approved service area: omit or explain ineligibility.','Partner at capacity, suspended or no longer serving the address.','Compare price, collection timing and bin-delivery availability.','Confirm provider immediately or await permitted capacity review.','Declined provider selection returns to eligible choices without losing setup.','Existing household provider remains visible to joined residents.','Changing provider follows the shared-household authorization and transition flow.'],
'Provider selection is distinct from acceptance of a paid pickup request. Only the latter triggers the agreed automatic payment.')

F('bins','04 / New IoT bin request & delivery','One shared allocation, fulfilled through LAWMA inventory and the chosen partner.','“Our house needs enough bins, and I want to know when they will arrive.”',[
N('home',0,0,'Open household bins','See delivered + pending quantities',kind='start'),
N('exists',1,0,'Request already open?',kind='decision'),
N('track',2,0,'Track / amend request','No second tenant duplicate',detail='Authorized residents see the existing shared request. Amend quantity through the request owner/review process, never create a duplicate entitlement.',status='Confirmed direction'),
N('need',1,1,'Describe household need','Occupants, sizes, quantities',status='Confirmed direction',policy='P04'),
N('assess',2,1,'Partner assesses allocation','Confirm size, count and any cost',owner='Partner',policy='P04'),
N('stock',3,1,'Stock available?',kind='decision',owner='Partner'),
N('order',3,2,'Partner requests from LAWMA','LAWMA allocates; partner collects',owner='LAWMA',status='Confirmed direction',detail='Record serials, quantities and custody: LAWMA stock → partner stock. Never allocate the same identified bin to two premises.'),
N('wait',2,2,'Awaiting stock / part supplied','Track quantities; notified of changes',detail='Partial delivery leaves the remaining quantity open on this allocation. A second resident can see pending quantity but cannot claim it again.'),
N('delivery',3,3,'Arrange and confirm delivery','IDs scanned; recipient acknowledges',owner='Partner',detail='Only new IoT-integrated bins. Register bin/device IDs to the right premise. Missed delivery can be rescheduled; wrong or damaged bins go to an exception.'),
N('accepted',2,3,'Correct bins received?',kind='decision'),
N('problem',1,3,'Report delivery problem','Missing / wrong / damaged / missed',to='support'),
N('activate',2,4,'Delivered; check device status','Activation pending until first report',owner='Platform',detail='Delivery acknowledgement is distinct from telemetry activation. A faulty sensor creates a technical task; never display a fabricated live reading.'),
N('ready',3,4,'Your household bins','View status; request service / help',kind='end',to='booking'),
N('nobin',0,2,'No bin yet? Keep using app','Track rollout, provider, wallet, reports',detail='Pickup without an issued bin is a configurable interim-service policy. Do not block app access or silently promise interim collection.',policy='P05'),
],[E('home','exists'),E('exists','track','Yes'),E('exists','need','No'),E('need','assess'),E('assess','stock'),E('stock','order','No / replenish'),E('stock','delivery','Yes','right'),E('order','wait','Not yet fulfilled'),E('order','delivery','Stock collected'),E('wait','delivery','Available'),E('delivery','accepted'),E('accepted','problem','No'),E('accepted','activate','Yes'),E('activate','ready')],
['First household request; second resident finds and tracks it.','One bin, several bins, mixed sizes and later capacity increase.','Occupancy estimate reviewed; no invented occupants-to-bin entitlement.','Bin costs/subsidy or deposit shown if LAWMA adopts them.','LAWMA stock allocation, partner collection and household delivery.','Out of stock, partial allocation or partial delivery: pending quantity remains visible.','Missed appointment, wrong address, damaged/wrong bin or disputed delivery.','Delivered device not reporting, low battery or failed activation.','Lost/stolen bin, replacement, repair and retired asset: support and lifecycle flows.','No bin: account, reports and rollout tracking remain available.'],
'Every delivery links unique bin and device IDs to the residence. No retrofit path for old customer bins. LAWMA has not yet set allocation sizes, charges or interim pickup rules.')

F('wallet','05 / Wallet setup & top-up','Fund a personal customer wallet and make pending transactions understandable.','“Has my money arrived? Please do not charge me twice.”',[
N('open',0,0,'Open wallet','Balance, reserved funds and history',kind='start',status='Confirmed direction'),
N('identity',1,0,'Funding enabled?',kind='decision',detail='Use the selected regulated provider’s approved verification and limits. This verification is distinct from basic app sign-in.',policy='P08'),
N('verify',1,1,'Complete wallet verification','Pending / failed: retry or get help',owner='Payment provider',policy='P08'),
N('method',2,0,'Choose amount & method','Show any fee before proceeding',status='Confirmed direction'),
N('transfer',3,0,'Bank / fintech transfer','Copy account + reference',owner='Payment provider',detail='Recommended primary option. A verified provider event, not a screenshot or app return, credits the balance.'),
N('card',2,1,'Card or supported USSD','Secure provider authorization',owner='Payment provider',detail='A third-party processor supplies channels; it is not itself a fourth payment method. USSD availability depends on provider and bank support.'),
N('result',3,2,'Provider confirmed?',kind='decision',owner='Payment provider'),
N('pending',2,2,'Payment pending / unknown','Keep reference; track status',detail='Do not suggest immediate repeat payment. Reconcile the original reference and provide a report-payment action if it remains unresolved.'),
N('failed',2,3,'Failed / cancelled','Explain result; retry when definite',detail='A failed or cancelled top-up does not credit the wallet. Preserve transaction history and distinguish a reversal from an unconfirmed debit.'),
N('credited',3,3,'Wallet credited once','Updated balance + funding receipt',kind='end',detail='Duplicate confirmation events must not credit the wallet twice. Existing reserved amounts remain separate from available funds.'),
N('use',3,4,'Continue to pickup','Or return to your home',kind='end',to='booking'),
N('issue',1,3,'Debited but not credited?','Open payment case with reference',to='support'),
N('assist',0,2,'Need help funding?','Supported channels / assisted help',detail='Authorized agent cash-in is an inclusion option for later evaluation, not a confirmed launch feature. Account and reports remain usable without a funded wallet.',policy='P08'),
],[E('open','identity'),E('identity','method','Yes'),E('identity','verify','No'),E('verify','method','Verified'),E('method','transfer','Transfer'),E('method','card','Card / USSD'),E('transfer','result','Provider response'),E('card','result','Provider response'),E('result','credited','Success'),E('result','pending','Unknown'),E('pending','failed','Confirmed failure'),E('pending','issue','Needs investigation'),E('pending','credited','Confirmed'),E('credited','use')],
['Personal wallet activation; verification pending, failed or limits reached.','Bank transfer, bank/fintech app transfer, card and supported USSD.','Show funding amount, fees and limits before authorization.','Insufficient bank funds, declined card, cancelled checkout or expired USSD.','App closes during authorization; reconcile the original transaction on return.','Bank debit reported but top-up pending; report using the transaction reference.','Repeated callback or repeated tap: one credit, one funding reference.','Wallet has available and reserved funds; do not merge household residents’ money.','Optional authorized agent cash-in requires a provider/policy decision.'],
'Wallet funding and bin delivery are independent. Real money custody and execution belong to the selected authorized payment provider; the demonstration uses sample balances.')

F('booking','06 / Request pickup & automatic payment','One authorized request links the selected home, provider, quote and paying wallet.','“Tell me the total and exactly when the money leaves my wallet.”',[
N('start',0,0,'Request pickup','Choose home, bins and time / plan',kind='start',detail='Select the paying customer wallet explicitly. Shared bins do not permit a resident or partner to debit another resident’s wallet.'),
N('eligible',1,0,'Service available?',kind='decision',policy='P05'),
N('quote',2,0,'Review pickup & total','Provider, price, window, payment rule',detail='Show that accepting this request authorizes automatic payment when the partner accepts. Do not assume a monthly subscription.',policy='P06'),
N('balance',3,0,'Enough available funds?',kind='decision'),
N('unavailable',1,1,'No slot / no bin eligibility','Choose another slot or get help',detail='Retain request details. A no-bin customer may use interim service only where the agreed rollout policy permits it.',policy='P05'),
N('fund',3,1,'Top up, then resume','Recheck quote and availability',to='wallet'),
N('confirm',2,1,'Confirm request & payment','Reserve quoted amount; send request',detail='Use one booking reference and one reservation. Offline drafts and repeat taps cannot create paid bookings until the server confirms receipt.',status='Confirmed direction'),
N('response',2,2,'Partner accepts?',kind='decision',owner='Partner',status='Confirmed direction'),
N('release',1,2,'Declined / expired / cancelled','Release reserved funds; notify',detail='Before acceptance, only one final state wins: acceptance or cancellation/expiry. The same request cannot both pay the partner and release the funds.'),
N('pay',3,2,'Pay partner automatically','No separate withdrawal action',owner='Payment provider',status='Confirmed direction',detail='Acceptance triggers payment initiation. Show Paid only when confirmed. Partner acceptance is a service commitment, not evidence that collection happened.'),
N('paid',3,3,'Payment confirmed?',kind='decision',owner='Payment provider'),
N('pending',2,3,'Payment processing / failed','Reconcile; retry same reference',owner='Platform',detail='Do not send a second payment on repeated acceptance. Show a clear payment status to both sides; operational handling of a failed payout is an open policy.',policy='P08'),
N('scheduled',3,4,'Accepted + payment receipt','Track agreed pickup window',kind='end',to='collection'),
N('retry',1,3,'Revise or request again','No duplicate active household pickup',to='booking'),
N('after',0,3,'Cancel after acceptance','Show terms; request cancellation',to='support',detail='Payment already triggered. A refund is governed by the agreed cancellation/failed-service policy; do not promise instant reversal.',policy='P07'),
],[E('start','eligible'),E('eligible','quote','Yes'),E('eligible','unavailable','No'),E('quote','balance'),E('balance','fund','No'),E('balance','confirm','Yes'),E('fund','confirm','Funded; rechecked'),E('confirm','response'),E('response','release','No / expired'),E('release','retry'),E('response','pay','Yes'),E('pay','paid'),E('paid','scheduled','Yes'),E('paid','pending','No / unknown')],
['On-demand request; recurring service is conditional on an agreed policy.','Selected home, shared bins and explicit paying wallet.','No bin, provider unavailable, missed service coverage or no available slot.','Clear quote with fees; re-quote requires customer confirmation if price changes.','Insufficient available balance: top up and resume with availability rechecked.','Duplicate resident request or repeated tap: show the active request.','Partner acceptance automatically triggers payment, with receipts to both sides.','Partner decline, acceptance timeout or cancellation before acceptance releases funds.','Acceptance and cancellation at the same time: one final state, no double movement.','Partner payment pending/failed: reconcile the same reference, no duplicate debit.','Cancellation after acceptance uses the agreed refund policy.'],
'Automatic payment on acceptance is confirmed product direction. Refund rules, tariffs, subscription cadence and partner bank-settlement timing remain open.')

F('collection','07 / Collection & service completion','Keep the customer informed and offer a clear recovery path when service falls short.','“Are they coming, and what can I do if they do not collect?”',[
N('accepted',0,0,'Pickup accepted','Receipt + scheduled service window',kind='start'),
N('track',1,0,'Track pickup status','Scheduled → on the way → arrived',detail='Only show a live vehicle location or ETA if fresh position data exists. Otherwise show the scheduled window, status and last update.'),
N('access',2,0,'Collection possible?',kind='decision',owner='Partner'),
N('evidence',3,0,'Record collection evidence','Correct premise, bins, time, outcome',owner='Partner',detail='Sensor drop can support a service record. It does not independently prove collection. Do not expose another household’s evidence.'),
N('blocked',2,1,'Access blocked / customer absent','Contact; record reason; arrange next step',owner='Partner',detail='Use an agreed contact approach and policy. No surprise extra charge or unattended cancellation.',policy='P07'),
N('late',1,1,'Late / breakdown / no-show','Updated window or recovery request',to='support'),
N('notify',3,1,'Collection reported complete','Notify customer; show service receipt'),
N('correct',3,2,'Outcome correct?',kind='decision'),
N('problem',2,2,'Not collected / partial service','Report against this pickup',to='support'),
N('finish',3,3,'Service completed','History, receipt, optional feedback',kind='end'),
N('again',3,4,'Next collection','Request again or manage agreed plan',kind='end',to='booking'),
N('silent',1,3,'Customer does not respond','Retain reported outcome + evidence',owner='Platform',detail='Do not fabricate customer confirmation. Any automatic closure/dispute window must be explicitly configured and visible.',policy='P10'),
N('incident',0,2,'Unsafe spill / fire / hazard','Safety guidance + urgent report',to='support',detail='Avoid asking the resident to handle hazardous material. Verified local emergency contacts and escalation rules must be agreed.',policy='P10'),
],[E('accepted','track'),E('track','access'),E('track','late','Delay'),E('access','evidence','Yes'),E('access','blocked','No'),E('evidence','notify'),E('notify','correct'),E('correct','problem','No'),E('correct','finish','Yes'),E('correct','silent','No response'),E('finish','again')],
['Normal pickup with scheduling, arrival, evidence and service history.','GPS unavailable or stale: show status/last update without invented live tracking.','Truck delayed, breakdown, missed window or partner no-show.','Gate locked, customer unavailable or bins inaccessible.','One of several bins collected: record a partial outcome.','Partner reports completion but customer disputes it.','Customer does not respond: distinguish partner report from customer confirmation.','Spillage, fire or other hazard: urgent reporting with approved guidance.','Post-service feedback relates to a completed service; it is optional.'],
'Payment occurred on acceptance in the agreed model. A completion dispute connects to support and any approved financial adjustment; it never silently repeats payment.')

F('support','08 / Reports, escalation & refunds','One case follows the issue from the resident through the responsible team to a visible outcome.','“I should not have to explain the same problem to three different people.”',[
N('report',0,0,'Report a problem','Pickup, bin, payment or partner',kind='start',detail='Prefill home, bin, pickup/payment reference when known. Accept an optional photo or description. Public dumping reports can have a separate location.'),
N('submit',1,0,'Submit once; get reference','Track case and expected next step',detail='If offline, show draft/queued rather than submitted. Send only after connection returns and use a stable case reference.'),
N('route',2,0,'Route by issue type','Operational, financial or urgent',owner='Platform'),
N('owner',3,0,'Responsible team responds','Partner / payment support / LAWMA',owner='Partner',detail='Routing assigns the correct owner. Payment provider executes a refund only after authorized decision; the waste partner does not edit balances directly.'),
N('resolved',3,1,'Response acceptable?',kind='decision'),
N('escalate',2,1,'Escalate with full history','Overdue, contested or serious case',owner='LAWMA',policy='P10'),
N('decision',2,2,'Review evidence & decide','Recovery, repair, replacement or refund',owner='LAWMA'),
N('refund',3,2,'Refund required?',kind='decision'),
N('credit',3,3,'Process approved refund','Pending → confirmed; linked receipt',owner='Payment provider',detail='Refund destination, amount and deduction rules remain open. Notify when provider-confirmed; a failed refund stays visible for investigation.',policy='P07'),
N('restore',2,3,'Restore the service','Recollect / repair / replace / explain',owner='Partner'),
N('close',2,4,'Share outcome; confirm closure','Reopen / appeal if still unresolved',kind='end',detail='Keep resolution evidence and financial references together. A disagreement must not force the customer to create an unrelated duplicate case.'),
N('urgent',0,2,'Immediate danger reported','Approved emergency guidance + alert',owner='LAWMA',detail='The app is not a substitute for emergency response. Use approved contact details and an accountable response team; no invented emergency numbers.',policy='P10'),
N('timeout',1,2,'Response overdue','Notify owner; escalate per SLA',owner='Platform',policy='P10'),
],[E('report','submit'),E('submit','route'),E('route','owner'),E('owner','resolved'),E('resolved','escalate','No'),E('resolved','refund','Yes'),E('escalate','decision'),E('decision','refund'),E('refund','credit','Yes'),E('refund','restore','No / operational'),E('credit','close','Confirmed'),E('restore','close','Outcome recorded')],
['Missed/late/partial collection; wrong bin, damaged bin or delivery issue.','Lost/stolen bin and device offline/low-battery maintenance.','Overfilled bin or illegal dumping report with a location and optional evidence.','Top-up missing, unexpected charge, failed payment, duplicate-charge allegation.','Cancellation after acceptance and service failure with refund review.','Partner misconduct or disputed service evidence.','Duplicate report: link to existing case rather than lose its history.','Overdue response or disagreement escalates to LAWMA with the full record.','Approved refund pending, failed or completed; customer gets a receipt only when confirmed.','Customer disagrees with closure: reopen/appeal within the agreed policy.','Urgent environmental/safety report follows a dedicated accountable route.'],
'SLA durations, cancellation charges, refund entitlement and appeal windows are pending LAWMA decisions. No amounts or response-time promises are invented.')

F('lifecycle','09 / Daily use & account changes','Keep household service, bins and personal money correct as needs and occupants change.','“We need more bins—or I am moving out. What happens to our service?”',[
N('bins',0,0,'Bin health / capacity','From Home or a sensor alert',kind='start',detail='Show freshness and unknown status explicitly. A fill alert can suggest a pickup; it cannot silently create a paid booking.'),
N('extra',1,0,'Request size / quantity change','Review existing + pending allocation',to='bins',policy='P04'),
N('maintenance',0,1,'Report repair / replacement','Keep asset and issue references',to='support'),
N('members',1,1,'Manage household access','Invite, leave or hand over contact',kind='start',policy='P02'),
N('move',2,1,'Moving to a new residence','Verify new home; resolve old service',detail='Bins stay associated with the old premise unless reassigned under policy. Do not take another resident’s funds, transfer a wallet or abandon an open paid pickup.',policy='P09'),
N('moved',3,1,'Membership updated','Home verified; old contact handed over',kind='end'),
N('switch',0,2,'Change service provider','From household service settings',kind='start',policy='P03'),
N('transition',1,2,'Review provider transition','Eligible choice, open work, bin custody',detail='Authorized household contact reviews pending pickups, bin custody, unpaid obligations and transition date. No duplicate provider charge.',to='providers'),
N('changed',2,2,'New provider confirmed','Transition date visible to household',kind='end'),
N('plan',0,4,'Recurring service (optional)','Only if LAWMA adopts this model',kind='start',policy='P06'),
N('consent',1,4,'Explicit plan authorization','Price, dates, reminders, pause / cancel',detail='One-off request consent does not authorize future monthly charges. Insufficient balance prompts action; retries cannot create repeated charges.',policy='P06'),
N('planactive',2,4,'Plan active / paused / cancelled','Customer sees next charge or end date',kind='end'),
N('personal',0,3,'Personal account settings','Phone, privacy, notifications, security',kind='start'),
N('close',1,3,'Request account closure','Review open service and wallet balance',detail='Close personal access separately from the shared premise record. Resolve remaining wallet funds through the provider; lawful record-retention requirements require policy.',policy='P09'),
N('review',2,3,'Resolve open obligations','Balance return; shared contact handover',owner='Platform',policy='P09'),
N('done',3,3,'Closure confirmed','Shared residence remains intact',kind='end'),
N('report',3,4,'Always available: report / help','Even without a bin or funded wallet',to='support',status='Confirmed direction'),
],[E('bins','extra','Capacity'),E('bins','maintenance','Fault / damage'),E('members','move','Moving'),E('move','moved'),E('switch','transition'),E('transition','changed','Confirmed'),E('plan','consent','Opt in'),E('consent','planactive'),E('personal','close','Close'),E('close','review'),E('review','done','Resolved')],
['Sensor full alert: suggest pickup; customer still authorizes the charge.','Stale/missing reading: unknown status, last update and maintenance help.','Changing occupancy: amend approved quantities/sizes, no duplicate entitlement.','Invite/remove resident and hand over household contact with review.','Move out or add another residence: separate allocations and verified membership.','Switch provider: manage open work and bin custody before transition.','Optional recurring plan requires explicit opt-in and clear pause/cancel behavior.','Recurring insufficient balance and provider unavailability need visible recovery.','Change phone or device securely; manage push and privacy preferences.','Close an account with remaining balance/open case; resolve and explain retention.','Personal wallets are never silently pooled, reassigned or accessible to other tenants.'],
'These are parallel tasks from Home, not a mandatory sequence. The connecting arrows show related next steps. Recurring plans remain a policy option, not a confirmed monthly service.')

POLICIES=[
('P01','What counts as one residence?','Default shared house/compound; verify when separate units legitimately need independent service. Address similarity alone must not merge households.'),
('P02','Who can act for the household?','Membership verification, authorized service contact, tenant handover and dispute resolution. Personal wallet consent always belongs to its owner.'),
('P03','How is provider choice governed?','Approved service areas, capacity, selection confirmation and switching rules. Nearby does not automatically mean permitted to serve.'),
('P04','How many bins, which sizes and at what cost?','Occupancy/capacity guidance, bin prices/subsidies, additional allocation and replacement terms. No hard-coded household size ratio.'),
('P05','What can a customer do before receiving a bin?','App access, rollout tracking and reporting are available. Interim paid pickup eligibility must be agreed; do not assume it is forbidden or available everywhere.'),
('P06','What is the service and pricing model?','On-demand versus monthly/recurring, tariffs, fees and shared-household request permissions. Recurring payment needs separate consent.'),
('P07','What happens after cancellation or failed service?','Acceptance triggers payment. Define refund eligibility, partial collection, no-show, rescheduling, cancellation fees and refund destination.'),
('P08','How are funds held and settled?','Select an authorized payment provider; agree identity checks, limits, payment failure handling and bank settlement. Confirmed payment and provider initiation are distinct states.'),
('P09','What happens when residents move or leave?','Bin custody, service transfer, account closure, balance return and retention. Shared premise assets remain separate from personal accounts.'),
('P10','When does an issue escalate or close?','Response SLAs, urgent incident routing, customer non-response, automatic closure and appeal window. No invented deadlines.'),
]

COLORS={'Customer':('#ffffff','#d6dcd9','#233931'),'Partner':('#edf4fb','#b7cee3','#235878'),'LAWMA':('#fff0e2','#edbc91','#90460c'),'Payment provider':('#f3eefb','#cec0e3','#644586'),'Platform':('#f0f3f1','#c7d2cc','#496451')}
W=1300; BW=254; BH=110
def pos(n): return (36+n['c']*320,36+n['r']*170)
def txt(s): return html.escape(str(s),quote=True)
def svg_for(flow):
    height=36+max(n['r'] for n in flow['nodes'])*170+BH+42
    parts=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {height}" role="img" aria-labelledby="title-{flow["id"]} desc-{flow["id"]}" style="font-family:Arial,sans-serif"><title id="title-{flow["id"]}">{txt(flow["title"])}</title><desc id="desc-{flow["id"]}">{txt(flow["intent"])}</desc><defs><marker id="arrow-{flow["id"]}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#84948b"/></marker></defs>']
    nodes={n['id']:n for n in flow['nodes']}
    for e in flow['edges']:
        a,b=nodes[e['a']],nodes[e['b']]; ax,ay=pos(a);bx,by=pos(b)
        if e['route'] in ('left','right'):
            xx=14 if e['route']=='left' else 1288
            sx=ax if e['route']=='left' else ax+BW;ex=bx if e['route']=='left' else bx+BW
            points=[(sx,ay+BH/2),(xx,ay+BH/2),(xx,by+BH/2),(ex,by+BH/2)];lx=xx;ly=(ay+by)/2+BH/2
        elif a['r']==b['r']:
            sign=1 if bx>ax else -1;sx=ax+(BW if sign==1 else 0);ex=bx+(0 if sign==1 else BW)
            points=[(sx,ay+BH/2),(ex,by+BH/2)];lx=(sx+ex)/2;ly=ay+BH/2-11
        else:
            sy=ay+BH if by>ay else ay;ey=by if by>ay else by+BH
            mid=(sy+ey)/2
            points=[(ax+BW/2,sy),(ax+BW/2,mid),(bx+BW/2,mid),(bx+BW/2,ey)]
            lx=(ax+bx)/2+BW/2;ly=mid-9
            if ax==bx:lx+=12;ly=mid
        path='M'+' L'.join(f'{x},{y}' for x,y in points)
        parts.append(f'<path d="{path}" fill="none" stroke="#84948b" stroke-width="1.6" stroke-linejoin="round" marker-end="url(#arrow-{flow["id"]})"/>')
        if e['label']:
            labels=textwrap.wrap(e['label'],11 if a['r']==b['r'] else 23)
            length=max(len(s) for s in labels)*5.2+10
            labely=ly-(len(labels)-1)*6
            parts.append(f'<rect x="{lx-length/2}" y="{labely-10}" width="{length}" height="{len(labels)*12+4}" rx="4" fill="#f7faf7"/>')
            for i,label in enumerate(labels):parts.append(f'<text x="{lx}" y="{labely+1+i*12}" text-anchor="middle" fill="#466051" font-size="10">{txt(label)}</text>')
    for n in flow['nodes']:
        x,y=pos(n);fill,stroke,ink=COLORS[n['owner']]
        parts.append(f'<g class="flow-node" data-node="{n["id"]}" tabindex="0" role="button" aria-label="{txt(n["title"]+". "+n["sub"])}"><title>{txt(n["detail"])}</title>')
        if n['kind']=='decision':
            parts.append(f'<path d="M{x+BW/2} {y}L{x+BW} {y+BH/2}L{x+BW/2} {y+BH}L{x} {y+BH/2}Z" fill="#fff7dd" stroke="#dcc780" stroke-width="1.4"/>')
            lines=textwrap.wrap(n['title'],24)
            for i,line in enumerate(lines):parts.append(f'<text x="{x+BW/2}" y="{y+51+(i-(len(lines)-1)/2)*18}" text-anchor="middle" font-size="14" font-weight="700" fill="#695414">{txt(line)}</text>')
            if n['policy']:parts.append(f'<text x="{x+BW/2}" y="{y+77}" text-anchor="middle" font-size="10" fill="#78622b">{n["policy"]} · policy open</text>')
        else:
            radius=25 if n['kind'] in ('start','end') else 13
            if n['kind']=='end':fill='#eaf4ee';stroke='#b8d1c1'
            parts.append(f'<rect x="{x}" y="{y}" width="{BW}" height="{BH}" rx="{radius}" fill="{fill}" stroke="{stroke}" stroke-width="1.3"/>')
            incoming=any(e['b']==n['id'] for e in flow['edges'])
            owner=n['owner'].upper()+('  /  OPEN FLOW' if n['to'] else '  /  ENTRY' if not incoming else '')
            parts.append(f'<text x="{x+17}" y="{y+22}" font-size="9.3" letter-spacing="1" fill="{ink}">{txt(owner)}</text>')
            lines=textwrap.wrap(n['title'],29)
            for i,line in enumerate(lines[:2]):parts.append(f'<text x="{x+17}" y="{y+46+i*18}" font-size="15.5" font-weight="700" fill="#203c2f">{txt(line)}</text>')
            subs=textwrap.wrap(n['sub'],37)
            sy=y+(85 if len(lines)>1 else 69)
            for i,line in enumerate(subs[:2 if len(lines)<2 else 1]):parts.append(f'<text x="{x+17}" y="{sy+i*16}" font-size="11.5" fill="#52675a">{txt(line)}</text>')
            if n['policy']:parts.append(f'<circle cx="{x+BW-13}" cy="{y+15}" r="4" fill="#c99731"/>')
        parts.append('</g>')
    parts.append('</svg>')
    return ''.join(parts)

for f in FLOWS:
    ids=[n['id'] for n in f['nodes']]
    assert len(ids)==len(set(ids)),f['id']
    for e in f['edges']:assert e['a'] in ids and e['b'] in ids,e
    for n in f['nodes']:
        if n['to']:assert n['to'] in [a['id'] for a in FLOWS],n
    f['svg']=svg_for(f)
    (OUT/(f['id']+'.svg')).write_text(f['svg'])

template=(Path(__file__).parent/'template.html').read_text()
payload=json.dumps(dict(flows=FLOWS,policies=POLICIES),ensure_ascii=False).replace('</','<\\/')
logo=base64.b64encode((ROOT/'outputs/presentation-assets/smartwaste360.svg').read_bytes()).decode()
result=template.replace('__FLOW_DATA__',payload).replace('__LOGO__',logo)
(ROOT/'docs/CUSTOMER-APP-USER-FLOW.html').write_text(result)

md=['# SmartWaste 360 — customer app end-to-end flow', '', 'Prepared 7 October 2026. Design specification for a native iOS/Android app. All scenarios are design scenarios derived from the user brief, not completed user research or implemented production features.', '', '[Open interactive flow atlas](CUSTOMER-APP-USER-FLOW.html). [Download the printable PDF](../outputs/customer-flow/SmartWaste360-Customer-User-Flows.pdf).', '', 'The approved product direction includes nearby eligible provider choice, new IoT bins issued LAWMA → partner → residence, one shared premise allocation with multiple sizes/quantities, personal customer wallets, automatic payment at partner acceptance, and inclusion before bin allocation. Proposed interaction safeguards and unresolved policies are identified in the atlas.', '']
for f in FLOWS:
    md+=['## '+f['title'],'',f['intent'],'','Anticipated customer question: '+f['thought'],'','![Flowchart](../outputs/customer-flow/'+f['id']+'.svg)','','### Scenario coverage','']
    md += ['- '+c for c in f['cases']]
    md += ['',f['note'],'','### Actions and transitions','', '| Action | Owner | Next step |','|---|---|---|']
    for n in f['nodes']:
        outgoing=[(next(x['title'] for x in f['nodes'] if x['id']==e['b'])+(' ('+e['label']+')' if e['label'] else '')) for e in f['edges'] if e['a']==n['id']]
        if n['to']:outgoing.append('Open '+n['to']+' flow')
        md.append('| '+n['title']+' | '+n['owner']+' | '+('; '.join(outgoing) or 'Visible state; resume or get help as described')+' |')
    md+=['']
md+=['## Open policy decisions','']+[f'- **{a} — {b}:** {c}' for a,b,c in POLICIES]
md+=['','## Source and scope','', 'Source: user corrections on 7 October 2026 and [Customer App, Partner Service, IoT Bin Provisioning & Wallet](CUSTOMER-APP-PARTNER-SERVICE-AND-IOT-BIN-PROVISIONING.md). The customer quotations are anticipated questions for design, not interview quotations. Financial, household verification and service timing rules remain subject to the identified policy decisions. The flow artifact is a design map, not the customer app itself.']
(ROOT/'docs/CUSTOMER-APP-USER-FLOW.md').write_text('\n'.join(md))
print(json.dumps({'flows':len(FLOWS),'scenarios':sum(len(f['cases']) for f in FLOWS),'nodes':sum(len(f['nodes']) for f in FLOWS),'output':str(ROOT/'docs/CUSTOMER-APP-USER-FLOW.html')}))
