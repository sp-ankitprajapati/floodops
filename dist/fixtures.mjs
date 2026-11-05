export const DEMO_NOW='2026-11-05T10:00:00+05:30';
export const sampleXML=`<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
 <identifier>FLOODOPS-EXERCISE-001</identifier><sender>exercise@floodops.invalid</sender>
 <sent>2026-11-05T08:00:00+05:30</sent><status>Exercise</status><msgType>Alert</msgType><scope>Public</scope>
 <info><language>en-IN</language><category>Met</category><event>Urban flood preparedness exercise</event>
 <urgency>Expected</urgency><severity>Severe</severity><certainty>Possible</certainty>
 <effective>2026-11-05T08:00:00+05:30</effective><onset>2026-11-05T14:00:00+05:30</onset><expires>2026-11-05T20:00:00+05:30</expires>
 <headline>EXERCISE: review readiness for a fictional heavy-rain event</headline>
 <description>This is synthetic exercise data created for testing FloodOps. There is no actual warning, weather forecast, issuing authority or affected institution. The scenario asks a fictional organisation to review its existing preparedness arrangements.</description>
 <instruction>EXERCISE ONLY. Review the source details and the sample preparedness notes. A human coordinator must review and assign tasks. Do not use this exercise as a real emergency instruction.</instruction>
 <area><areaDesc>Exercise Zone A — fictional study area</areaDesc></area></info>
</alert>`;
export const sampleCancelXML=`<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2"><identifier>FLOODOPS-EXERCISE-002</identifier><sender>exercise@floodops.invalid</sender><sent>2026-11-05T09:30:00+05:30</sent><status>Exercise</status><msgType>Cancel</msgType><scope>Public</scope><references>exercise@floodops.invalid,FLOODOPS-EXERCISE-001,2026-11-05T08:00:00+05:30</references></alert>`;
