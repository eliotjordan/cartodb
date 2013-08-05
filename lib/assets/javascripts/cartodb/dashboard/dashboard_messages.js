/**
* User stats embeded in the dashboard
*
* It shows the tables and the space used in the user account
* You must set the username, the user id and the tables model,
* if not, it won't work.
*
* Usage example:
*
*  var userStats = new cdb.admin.dashboard.UserStats({
*    el: $('div.subheader'),
*    model: this.user**
*  })
*
*  **  It needs a user model to work properly.
*
*/

cdb.admin.dashboard.Message = cdb.core.Model.extend({
  defaults: {
    key: null,
    sticky: false,
    message: null
  }
});

cdb.admin.dashboard.MessageItem = cdb.core.View.extend({

  tagName: "li",

  events: {

    "click": "_onClick"

  },

  initialize: function() {

    this.template = _.template('<div class="inner"><%= message%><% if (!sticky) {%><a href="#close" class="smaller close">x</a><% } %></div>');

  },

  _onClick: function(e) {
    e.preventDefault();
    e.stopPropagation();

    this.trigger("remove", this);

  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));

    return this;

  }

});

cdb.admin.dashboard.MessageItems = Backbone.Collection.extend({
  model: "cdb.admin.dashboard.Message"
});

cdb.admin.dashboard.Messages = cdb.core.View.extend({

  tagName: "section",
  className: "warning",

  _MESSAGES: {
    limit:       { template: 'Hey <strong><%= username %></strong>, looks like you\'re about to reach your account limit. Start thinking about <a href="<%= upgrade_url %>" class ="underline">upgrading your plan</a>.', sticky: true },
    upgraded:    { template: 'Great! Welcome to your brand new <strong><%= account_type %></strong> CartoDB. Now we love you even more than before ;)', store: true },
    trial_ended: { template: 'Just a reminder, your <strong><%= account_type %></strong> trial will finish the next <%= trial_ends_at %>. Happy mapping!', store: true }
  },

  initialize: function() {

    this.template = _.template('<ul></ul>');

    this.messages       = new cdb.admin.dashboard.MessageItems();

    this._setupLocalStorage();

    this.messages.bind("reset",  this.render,        this);
    this.messages.bind("add",    this._onAddMessage,    this);
    this.messages.bind("remove", this._onRemoveMessage, this);

    this.addView(this.messages);

    this.loadMessages();

  },

  _setupLocalStorage: function() {

    var key = this.options.localStorageKey || 'dashboard_message_storage';

    this.storage = new cdb.admin.localStorage(key);

  },

  storeMessages: function() {

    var messages = this.messages.filter(function(message) { return message.get("store"); });

    this.storage.set(messages);

  },

  loadMessages: function() {

    var messages = _.map(this.storage.get(), function(m) {
      return new cdb.admin.dashboard.Message(m);
    });

    this.messages.reset(messages);

  },

  addMessage: function(key, data) {

    var messageData = this._MESSAGES[key];
    var message = _.template(messageData.template, data);

    var opt = _.extend(messageData, { key: key });

    this.add(message, opt)

  },

  removeMessage: function(key) {

    var message = this.messages.find(function(message) { return message.get("key") == key; });

    this.messages.remove(message);

  },

  add: function(text, options) {

    var duplicated = this.messages.find(function(message) { return message.get("message") == text; });

    if (duplicated != undefined) return;

    var opt = _.extend({ message: text }, options);
    var message = new cdb.admin.dashboard.Message(opt);

    this.messages.push(message);

    if (opt.store) this.storeMessages();

  },

  _onAddMessage: function(model) {

    this.$el.removeClass("hidden");
    this._addMessage(model);

  },

  _onRemoveMessage: function(model) {

    var self = this;

    var className = model.get("key") || model.cid;

    this.$el.find("." + className).slideUp(250, function() {
      this.remove();
      if (self.messages.length == 0) self.$el.addClass("hidden");
    });

    this.storeMessages();

  },

  _removeMessage: function(item) {

    if (!item.model.get("sticky")) {
      this.messages.remove(item.model);
    }

  },

  _addMessage: function(model) {

    var view = new cdb.admin.dashboard.MessageItem({
      className: model.get("key") || model.cid,
      model: model
    });

    view.bind("remove", this._removeMessage, this);

    this.$el.find("ul").append(view.render().$el);
    view.$el.slideDown(250);

  },

  render: function() {

    this.$el.empty();
    this.$el.append(this.template);

    this.messages.each(this._addMessage, this);

    if (this.messages.length == 0) this.$el.addClass("hidden");
    else this.$el.removeClass("hidden");

    return this;

  }

});
