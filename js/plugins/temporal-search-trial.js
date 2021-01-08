/**
 * jspsych-html-keyboard-response
 * Josh de Leeuw
 *
 * plugin for displaying a stimulus and getting a keyboard response
 *
 * documentation: docs.jspsych.org
 *
 **/


jsPsych.plugins["temporal-search"] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'temporal-search',
    description: '',
    parameters: {
      practice: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Practice",
        default: undefined,
        description: "true if this is a practice block."
      },
      search_type: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Search type',
        default: "temporal"
      },
      stream_length: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'RSVP stream length',
        default: 16,
        description: "Number of search items contained within RSVP stream"
      },
      target_fill: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Target fill',
        default: null,
        description: "RGB value, selected from colourspaces.js, which corresponds to target fill."
      },
      distractor_fills: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Distractor Fills",
        array: true,
        default: undefined,
        description: "List from which distractor fills (passed to background-color) are selected from."
      },
      target_present:{
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Target present',
        default: undefined,
        description: "Should target be present during trial?"
      },
      TD_cond: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Target-distractor condition',
        default: undefined,
        description: "Condition which defined fill similarity between target and distractors"
      },
      DD_cond: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'distractor-distractor condition',
        default: undefined,
        description: "Condition which defined fill similarity between distractors"
      },
      choices: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        array: true,
        pretty_name: 'Choices',
        default: jsPsych.ALL_KEYS,
        description: 'The keys the subject is allowed to press to respond to the stimulus.'
      },
      preview_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Preview duration',
        default: 1000,
        description: 'How long to present target preview before fixation onset'
      },
      fix_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Fixation duration',
        default: 1000,
        description: 'How long to present fixation before onset of first masking array.'
      },
      mask_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Masking stimulus duration',
        default: 50,
        description: 'How long to present masking stimulus.'
      },
      ISI_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Inter-stimulus interval',
        default: 0,
        description: 'Delay between offset of mask and onset of array, or vice-versa.'
      },
      item_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Search item duration',
        default: 150,
        description: 'How long to present search item before replacement.'
      },
      response_window: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Response window',
        default: 3000,
        description: 'Duration to listen for response following stream completion before trial self-terminates.'
      },
      feedback_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Feedback duration",
        default: 500,
        description: "Duration to present feedback before trial termination"
      }

    }
  }

  plugin.get_fills = function() {
    let fills = []

    if (trial_data.target_present) {
      fills.push(trial_data.target_fill)
    }

    // Randomly select & push distractor fills until stream complete
    while (fills.length < trial_data.stream_length - 1) {
      let fill = randomChoice(trial_data.distractor_fills);
      fills.push(fill)
    }

    fills = array_shuffle(fills)

    if (trial_data.target_present) {
      let i = ranged_random(5,13)
      fills.splice(i, 0, trial_data.target_fill)
    }
    else {
      fills.push(randomChoice(trial_data.distractor_fills))
    }


    to_return = fills.reduce((r, a) => r.concat(a, 'white'), [1]).shift()

    return to_return

  }

  plugin.trial = function(display_element, trial) {

    $('#jspsych-loading-progress-bar-container').remove()

    trial_data = {
      practice_block: trial.practice,
      search_type: trial.search_type,
      stream_length: trial.stream_length,
      target_present: trial.target_present,
      TD_cond: trial.TD_cond,
      DD_cond: trial.DD_cond,
      target_fill: trial.target_fill,
      distractor_fills: trial.distractor_fills,
      mask_dur: trial.mask_duration,
      search_dur: trial.item_duration,
      ISI: trial.ISI_duration,
      rt: null,
      response: null,
      accuracy: null
    }

    var stim_fills = plugin.get_fills()

    // Given it's easier to use search-item here, instead of fixation, is fixation really necessary to define?
    var example = $('<div />').addClass('search-item').css('background-color', `${trial_data.target_fill}`)

    $(example).text(`TARGET`)


    var search_item = $('<div />').addClass('search-item')

    $(display_element).append(example)

    var keyboardListener;

    jsPsych.pluginAPI.setTimeout(function() {
      keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_response,
        valid_responses: trial.choices,
        rt_method: 'performance',
        persist: false,
        allow_held_key: false
      })

    }, trial_data.fix_dur)

    var trial_duration = trial.preview_duration + trial.fix_duration + (trial_data.search_dur*16) + (trial_data.mask_dur*16) + trial.response_window;

    jsPsych.pluginAPI.setTimeout(function() {
      jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener) // Stop listening for responses
      end_trial()
    }, trial_duration)

    function timer(ms) {return new Promise(res => jsPsych.pluginAPI.setTimeout(res, ms))}

    async function do_trial () {
      await timer(1000)
      $(display_element).html('')
      fixation()
    }

    async function fixation() {
      $(display_element).append(search_item)
      await timer(trial_data.fix_dur)
      run_rsvp()
    }

    async function run_rsvp () {

      for (let i=0; i < stim_fills.length; i++) {
        let delay = (i % 2 === 0) ? trial_data.search_dur : trial_data.mask_dur
        await timer(delay)
        $(search_item).css( 'background-color', `${stim_fills[i]}` )
      }
    }

    do_trial()

    // store response
    var response = {
      rt: null,
      key: null,
      acc: null,
    };

    // function to end trial when it is time
    var end_trial = function() {
      $(display_element).html('')
      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // kill keyboard listeners
      if (typeof keyboardListener !== 'undefined') {
        jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
      }

      // Determine response accuracy (if not timeout)
      if (response.key == null) {
        response.rt = 'TIMEOUT';
        response.key = 'TIMEOUT';
        response.acc = 'TIMEOUT'
      }
      else if (jsPsych.pluginAPI.compareKeys(response.key, trial.choices[0])) {
        response.key = 'PRESENT'
      }
      else {
        response.key = 'ABSENT'
      }

      if (response.key != 'TIMEOUT') {
        response.acc = (response.key == trial.target_present) ? 1 : 0
      }

      // gather the data to store for the trial
      trial_data.rt = response.rt
      trial_data.response = response.key
      trial_data.accuracy = response.acc

      // provide feedback on trial performance
      give_feedback(trial_data)
    };

    // function to handle responses by the subject
    var after_response = function(info) {
      // TODO: correct feedback not being provided.

      // only record the first response
      if (response.key == null) { response = info; }
      pr(response.key)
      end_trial();
    };


    var give_feedback = function(trial_data) {
      data_repo.push(trial_data)

      switch (trial_data.accuracy) {
        case "TIMEOUT":
          $(display_element).append('<p>TIMEOUT</p>')
          break
        case 1:
          $(display_element).append('<p>CORRECT</p>')
          break
        case 0:
          $(display_element).append('<p>INCORRECT</p>')
      }

      jsPsych.pluginAPI.setTimeout( function() {
        $(display_element).html('')
        jsPsych.finishTrial(trial_data)
      }, trial.feedback_duration)
    }
  };

  return plugin;
})();
