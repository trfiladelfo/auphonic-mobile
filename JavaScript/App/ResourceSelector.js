var Core = require('Core');
var Class = Core.Class;
var Events = Core.Events;
var Options = Core.Options;

var URLDelegate = require('Controller/URLDelegate');
var View = require('View');
var renderTemplate = require('UI/renderTemplate');
var UI = require('UI');

var Form = require('./Form');
var HTTPUpload = require('./HTTPUpload');
var ListFiles = require('./ListFiles');
var Recordings = require('./Recordings');
var Source = require('./Source');

var Auphonic = require('Auphonic');

module.exports = new Class({

  options: {
    allowLocalRecordings: false
  },

  Implements: [Events, Options, Class.Binds],

  initialize: function(popover, options) {
    this.setOptions(options);

    this.popover = popover;
    this.element = popover.getPopover();

    this.createURLDelegate()
      .createUI()
      .createViewController()
      .createForm()
      .defineURLs()
      .registerURLDelegate();
  },

  show: function() {
    this.URLDelegate.route('/production/source');
    return this;
  },

  createUI: function() {
    this.originalContent = this.element.getChildren();
    this.element.addClass('is-full-view').empty().set('html', renderTemplate('resource-selector', {
      delegate: this.URLDelegate.getId()
    }));
    return this;
  },

  createViewController: function() {
    var element = this.element;
    var header = element.getElement('header');
    var back = new UI.BackButton(header, new Element('a'));
    var action = new UI.ActionButton(header, new Element('a'), {
      //onClick: click
    });
    var title = new UI.Title(header, new Element('h1'));
    this.viewController = new View.Controller(element.getElement('.resource-selector-main'), {
      template: 'resource-selector-container',
      contentSelector: 'div.scroll-content',
      scrollableSelector: 'div.scrollable',

      delegate: this.URLDelegate,
      back: back,
      title: title,
      action: action,
      indicatorOptions: Auphonic.SpinnerOptions,
      smallIndicatorOptions: Auphonic.ViewSpinnerOptionsSmall,
      indicatorDelay: 500,
      iOSScrollFlashFix: false,

      onTransitionEnd: function() {
        var stack = this.getStack();
        var previous = stack && stack.getPrevious();
        if (previous && previous.isRendered()) previous.toElement().getElements('ul li a.selected').removeClass('selected');
      }
    });
    return this;
  },

  createForm: function() {
    this.form = new Form({
      viewController: this.viewController,
      delegate: this.URLDelegate.getId(),
      use: [
        Source,
        ListFiles,
        HTTPUpload,
        Recordings
      ]
    });
    return this;
  },

  createURLDelegate: function() {
    this.URLDelegate = new URLDelegate;
    return this;
  },

  registerURLDelegate: function() {
    URLDelegate.register(this.URLDelegate);
    return this;
  },

  defineURLs: function() {
    this.URLDelegate.define('/production/source', this.bound('showSources'))
      .define('/production/new/http-upload', this.bound('showHTTPUpload'))
      .define('/production/source/{service}', this.bound('listFiles'))
      .define('/production/select-file/{index}', this.bound('selectFile'))
      .define('/production/show-recordings', this.bound('showRecordings'))
      .define('/production/select-recording/{id}', this.bound('selectRecording'))
      .define('/production/new', this.bound('selectHTTPFile'));
    return this;
  },

  showSources: function() {
    this.form.show('service', {
      showOnlyRemote: true,
      showLocalRecordings: this.options.allowLocalRecordings
    });
  },

  showHTTPUpload: function() {
    this.form.show('http_upload');
  },

  listFiles: function(req) {
    var service = Source.setData(this.form, req.service);
    if (service) this.form.show('input_file', {
      hideArrows: true
    });
  },

  selectFile: function(req) {
    var service = Source.getData(this.form).service;
    ListFiles.setData(this.form, service, req.index);
    var file = ListFiles.getData(this.form).input_file;
    // Delay to make this interaction seem more fluid.
    (function() {
      this.fireEvent('selectFile', [service, file]);
      this.restore();
    }).delay(200, this);
  },

  showRecordings: function() {
    this.form.show('recording');
  },

  selectRecording: function(req) {
    // Delay to make this interaction seem more fluid.
    (function() {
      this.fireEvent('selectRecording', [req.id]);
      this.restore();
    }).delay(200, this);
  },

  selectHTTPFile: function(req) {
    var httpUpload = HTTPUpload.getData(this.form);
    this.fireEvent('selectFile', [null, httpUpload.input_file]);
    this.restore();
  },

  restore: function() {
    var originalContent = this.originalContent;
    var element = this.element;
    URLDelegate.unregister(this.URLDelegate);
    this.popover.close().addEvent('complete:once', function() {
      element.removeClass('is-full-view').empty().adopt(originalContent);
    });
  }

});
