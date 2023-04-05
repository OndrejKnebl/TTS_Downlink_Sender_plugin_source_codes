import React, { useState } from 'react';
import { PanelProps } from '@grafana/data';
import { SimplePanelOptions } from 'types';
import { Input, Button, Alert, Field, FieldSet, Cascader, SecretInput, Checkbox } from '@grafana/ui';
import { Buffer } from 'buffer';


interface Props extends PanelProps<SimplePanelOptions> {
  onOptionsChange: (options: SimplePanelOptions) => void;
}


export const SimplePanel: React.FC<Props> = ({ options, data, width, height, onOptionsChange }) => {

  const [logMessage, setLogMessage] = useState("Fill in the necessary information and send the downlink.");
  const [alertVariant, setAlertVariant] = useState<'info' | 'error' | 'warning' | 'success'>('info');

  const [ttnServer, setTTNServer] = useState(options.targetTTNServer ? options.targetTTNServer : 'https://eu1.cloud.thethings.network');

  const [isAPIKeyConfigured, setIsAPIKeyConfigured] = useState<boolean>(options.targetAPIkey !== '' && options.targetAPIkey !== undefined);
  const [appName, setAppName] = useState(options.targetAppName);
  const [endDeviceName, setEndDeviceName] = useState(options.targetEndDeviceName);

  const [fPort, setFport] = useState("1");
  const [priority, setPriority] = useState('NORMAL');
  const [insertMode, setInsertMode] = useState('replace');
  const [confirmedDownlink, setConfirmedDownlink] = useState<boolean>(false);

  const priorityOptions = [
    {label: 'Lowest', value: 'LOWEST',},
    {label: 'Low', value: 'LOW',},
    {label: 'Below normal', value: 'BELOW_NORMAL',},
    {label: 'Normal', value: 'NORMAL',},
    {label: 'Above normal', value: 'ABOVE_NORMAL',},
    {label: 'High', value: 'HIGH',},
    {label: 'Highest', value: 'HIGHEST',},
  ];

  const insertModeOptions = [
    {label: 'Push to downlink queue', value: 'push',},
    {label: 'Replace downlink queue', value: 'replace',},
  ];

  const [payloadBytes, setPayloadBytes] = useState("");

 
  function isValidHexPayload(payload: string): boolean {
    const hexRegex = /^[0-9a-fA-F]+$/;
    return hexRegex.test(payload);
  }


  const sendPostRequest = async () => {                                           // Method for send POST request
    

    if (!ttnServer || ttnServer.trim() === '') {                                  // Check if TTN server is not empty
      setAlertVariant('error');
      setLogMessage('TTN server is empty!');
      return;
    }

    if (!options.targetAPIkey || options.targetAPIkey.trim() === '') {            // Check if API key entry is not empty
      setAlertVariant('error');
      setLogMessage('API key is empty!');
      return;
    }

    if (!appName || appName.trim() === '') {                                      // Check if Application name is not empty
      setAlertVariant('error');
      setLogMessage('Application name is empty!');
      return;
    }

    if (!endDeviceName || endDeviceName.trim() === '') {                          // Check if End device entry is not empty
      setAlertVariant('error');
      setLogMessage('End device name is empty!');
      return;
    }

    if (payloadBytes === '') {                                                    // Check if Payload entry is not empty
      setAlertVariant('error');
      setLogMessage('Payload is empty!');
      return;
    }

    if (!isValidHexPayload(payloadBytes)) {                                       // Check if Payload is a hex value
      setAlertVariant('error');
      setLogMessage('Payload must be a hex value.');
      return;
    }

    if (payloadBytes.length % 2 !== 0) {                                          // Check if Payload is a complete hex value
      setAlertVariant('error');
      setLogMessage('Payload must be a complete hex value');
      return;
    }
    

    // targetUrl = 'https://eu1.cloud.thethings.network/api/v3/as/applications/' + appName + '/devices/' + endDeviceName + '/down/' + insertMode;
    
    const targetUrl = ttnServer + '/api/v3/as/applications/' + appName + '/devices/' + endDeviceName + '/down/' + insertMode;


    const payloadBase64 = Buffer.from(payloadBytes, 'hex').toString('base64')     // Encoding bytes payload to base64
  
    
    const header = {                                                              // POST request header
      'Authorization': `Bearer ${options.targetAPIkey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'my-integration/my-integration-version',
    };
    
    const data = {                                                                // POST request data
      "downlinks": [
        {
          "frm_payload": payloadBase64,
          "f_port": parseInt(fPort, 10),
          "confirmed": confirmedDownlink,
          "priority": priority
        }
      ]
    };


    try {
      const response = await fetch(targetUrl, {                                   // POST request
        method: 'POST',
        headers: header,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      } else {
        setAlertVariant('success');
        setLogMessage(`Success: ${response.status}`);
      }
    } catch (error) {
      setAlertVariant('error');
      setLogMessage(`Error: ${(error as Error).message}`);
    }
  };


  const handleSaveTTS = () => {                                                    // Handler for saving TTS settings
    setIsAPIKeyConfigured(options.targetAPIkey !== '');

    onOptionsChange({
      ...options,
      targetAppName: appName,
      targetEndDeviceName: endDeviceName,
      targetTTNServer: ttnServer,
    });

    setAlertVariant('warning');
    setLogMessage('TTS settings saved! Now please save the dashboard!');
  };


  const handleAPIKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {    // Handler for API key changes
    onOptionsChange({ ...options, targetAPIkey: event.target.value });
  };


  const handleAPIkeyReset = () => {                                               // Handler for API key reset
    onOptionsChange({ ...options, targetAPIkey: '' });
    setIsAPIKeyConfigured(false);
  };


  // Below is the section with the plugin graphics, where the elements are defined and the function calls that are bound to the elements

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex:1, justifyContent: 'center', height, width, paddingTop: '1%', paddingRight: '1%', paddingLeft: '1%', paddingBottom: '1%'}}>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'top', marginTop: '2%', marginBottom: '2%', marginLeft: '2%', marginRight: '2%'}}>
            <Alert title={logMessage.toString()} severity={alertVariant} />
        </div>
            

        <div style={{ display: 'flex', marginLeft: '1%', marginRight: '1%'}}>            
            <FieldSet label="TTS settings" style={{ marginLeft: '1%', marginRight: '5%', flex:1}}>
                <Field label="TTN server">
                    <Input 
                        value={ttnServer} 
                        name="ttnServer" 
                        placeholder="URL of the TTN cluster"
                        onChange={(e) => setTTNServer(e.currentTarget.value)} 
                    />
                </Field>
                <Field label="API key">
                    <SecretInput 
                        value={options.targetAPIkey} 
                        name="apiKey" 
                        isConfigured={isAPIKeyConfigured}
                        placeholder="Enter API key"
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleAPIKeyChange(event)}
                        onReset={handleAPIkeyReset}
                    />  
                </Field>
                <Field label="Application name">
                    <Input 
                        value={appName} 
                        name="appName" 
                        placeholder="Application name"
                        onChange={(e) => setAppName(e.currentTarget.value)} 
                    />
                </Field>
                <Field label="End device name">
                    <Input 
                        value={endDeviceName} 
                        name="endDeviceName" 
                        placeholder="End device name"
                        onChange={(e) => setEndDeviceName(e.currentTarget.value)} 
                    />
                </Field>
                <Button onClick={handleSaveTTS}>Save</Button>
            </FieldSet>


            <FieldSet label="Downlink" style={{ marginLeft: '5%', marginRight: '1%', flex:1}}>
                <Field label="FPort">
                    <Input 
                      value={fPort} 
                      name="fPort" 
                      type="number" 
                      min="1" 
                      max="223"
                      onChange={(e) => {
                        const value = parseInt(e.currentTarget.value, 10);
                        if (value >= 1 && value <= 223) {
                          setFport(e.currentTarget.value);
                        }
                      }}
                      />
                </Field>
                <Field label="Priority">
                    <Cascader
                        options={priorityOptions}
                        initialValue={priority}
                        onSelect={(value) => setPriority(value)}
                    />
                </Field>    
                <Field label="Insert mode">
                    <Cascader
                        options={insertModeOptions}
                        initialValue={insertMode}
                        onSelect={(value) => setInsertMode(value)}
                    />
                </Field>
                <Field>
                <div style={{ marginTop: '2%', marginBottom: '2%' }}>
                    <Checkbox
                        label="Confirmed downlink"
                        value={confirmedDownlink}
                        onChange={(event) => setConfirmedDownlink(event.currentTarget.checked)}
                    />
                </div>
                </Field>    
                <Field label="Payload - Bytes">
                    <Input 
                      pattern="^[0-9a-fA-F]*$"
                      onChange={(e) => setPayloadBytes(e.currentTarget.value)} 
                    />
                </Field>
                <Button onClick={sendPostRequest}>Send</Button>
            </FieldSet>
        </div>
    </div>
  );
};
