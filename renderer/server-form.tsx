import ipc = require('./lib/ipc');
import configuration = require('./lib/configuration');
import React = require('react');
import ReactComponent = require('./lib/react-component');
import Select = require('./select');

const user = configuration.getConfig('user') || {};
const servers = configuration.getConfig('servers') || [];
const serverDefaults = configuration.get('defaults', 'server');

function getServer(name: string): IServerInterface {
  return servers.filter(s => s.name === name)[0];
}

interface ServerFormProps {
  connect: (any) => void;
}

class ServerForm extends ReactComponent<ServerFormProps, {}> {
  private server: IServerInterface;
  private inputSetters: IDict<(text: string) => any> = {};

  constructor() {
    super();
    this.server = servers[0] || {};
  }

  onChange(newValue: string) {
    this.server = getServer(newValue);
    this.applyValues();
  }

  val(field: string): string {
    return this.server[field] || user[field] || serverDefaults[field] || '';
  }

  applyValues() {
    let fields = ['host', 'port', 'encoding', 'nick', 'username', 'password', 'realname'];
    let activeEle = document.activeElement;
    fields.forEach(fieldName => {
      this.inputSetters[fieldName](this.val(fieldName));
    });
    if(activeEle['focus'])
      activeEle['focus']();
  }

  componentDidMount() {
    this.applyValues();
  }

  componentDidUpdate() {
    this.applyValues();
  }

  render() {
    let select = servers.length > 0 ?
                 <Select name='name' onChange={this.onChange}
                         options={servers.map(s => s.name)} /> :
                 null;
    return (
      <div id='server-form'>
        <div className='logo'>
          <div className='logo-wrapper'>
            <img src='resource/image/logo.png' />
            <div>ココ</div>
          </div>
        </div>
        <div className='form-wrapper'>
          <form onSubmit={this.connect}>
            {select}
            {[
              {label: 'Host', inputName: 'host'},
              {label: 'Port', inputName: 'port'},
              {label: 'Encoding', inputName: 'encoding'},
              {label: 'Nick', inputName: 'nick'},
              {label: 'Username', inputName: 'username'},
              {label: 'Password', inputName: 'password', inputType: 'password'},
              {label: 'Real Name', inputName: 'realname'},
            ].map((field: IServerFormField) =>
              this.field(field.label, field.inputName, field.inputType))}
            <button>Connect</button>
          </form>
        </div>
      </div>
    );
  }

  field(label: string, inputName: string, inputType: string = 'text'): React.ReactElement<any> {
    let inputElement: HTMLInputElement;
    let labelElement: HTMLLabelElement;

    let updateEle = () => {
      if(inputElement)
        this.inputSetters[inputName] = (text: string) => {
          inputElement.value = text;
          updateEle();
        };

      if(!inputElement || !labelElement)
        return;

      if(inputElement.value.length > 0 || inputElement === document.activeElement) {
        labelElement.classList.add("active");
      } else {
        labelElement.classList.remove("active");
      }
    };

    return (
      <div className="input-field">
        <label htmlFor={inputName} ref={(ele) => {labelElement = (ele.getDOMNode() as HTMLLabelElement); updateEle(); }} onClick={() =>inputElement.focus()} >{label}</label>
        <input type={inputType} name={inputName} ref={(ele) => { inputElement = (ele.getDOMNode() as HTMLInputElement); updateEle(); }} onFocus={updateEle} onBlur={updateEle} onInput={updateEle} />
      </div>
    );
  }

  formToJSON(): any {
    let form = React.findDOMNode(this);
    let inputs = form.querySelectorAll('input');
    let result = Array.prototype.reduce.call(inputs, function (obj, input) {
      obj[input.name] = input.value;
      return obj;
    }, {});

    if (result.name && getServer(result.name).host !== result.host) {
      // user may re-input the host, so the name may be wrong
      delete result.name;
    }

    return result;
  }

  connect(e) {
    e.preventDefault();

    let data = this.formToJSON();
    this.props.connect(data);
    ipc.send('connect', data);
  }
}

export = ServerForm;
