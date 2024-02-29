import ReactDOM from 'react-dom';
import { AnalystTag } from '../../../../common/types';
import React, { Component, Fragment } from 'react';
import { IndexPattern } from '../../../../../../src/plugins/data/public';
import {
  DocViewFilterFn,
  ElasticSearchHit,
} from '../../../../../../src/plugins/discover/public/application/doc_views/doc_views_types';
import {
  EuiText,
  EuiFormRow,
  EuiSpacer,
  EuiButton,
  EuiCheckbox,
  htmlIdGenerator,
  EuiForm,
  EuiCollapsibleNavGroup,
  EuiCommentProps,
  EuiCommentList,
  EuiToolTip,
  EuiIcon,
  EuiOverlayMask,
  EuiConfirmModal,
  EuiSuperSelect,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiBadge,
} from '@elastic/eui';
import { getCore } from '../../../services';
import { FilterFlattened, FlattenedHitsToDisplayOptions, formatTag } from '../helpers';
import { CopyObject, ValToString } from '../../../../common/helpers';
import { tagDecoratorFactory } from 'src/plugins/saved_objects_tagging_oss/public/decorator/factory';

interface ATProps {
  filter?: DocViewFilterFn;
  hit: ElasticSearchHit;
  indexPattern?: IndexPattern;
  tags: EuiCommentProps[]; //i am assuming the tags are being stored as commentProps, cant find anything about this in elastics documentation
  setTags: (t: EuiCommentProps[]) => void;
  flattened?: Record<string, any>;
  currentTags: AnalystTag[];
  refreshDashboardTags?: () => void;
}

interface ATState {
  prototag: AnalystTag;
  tags: AnalystTag[];
  pendingTags?: AnalystTag[];
  options: EuiComboBoxOptionOption[];
  selectedoptions: EuiComboBoxOptionOption[];
  selectedField: string;
  flattenedhit?: Record<string, any>;
  applyAll_chkd: boolean;
  applyAll_dsbl: boolean;
  cbtxt_applyAll: string;
  isModalVisible: boolean;
  tagInValid: boolean;
  closenav: 'closed' | 'open';
}

export class AddTag extends Component<ATProps, ATState> {
  constructor(props: ATProps) {
    super(props);
    const flattened = props.indexPattern ? props.indexPattern.flattenHit(props.hit) : undefined;
    const emptyTag: AnalystTag = {
      originalIndex: props.flattened ? props.flattened['_index'] : props.indexPattern!.title,
      username: '',
      timestamp: '',
      originalId: props.flattened ? props.flattened['_id'] : flattened!['_id'],
      fieldname: '_id',
      fieldval: props.flattened ? props.flattened['_id'] : flattened!['_id'],
      tag: '',
      applytoall: false,
    };
    this.state = {
      prototag: emptyTag,
      tags: [emptyTag],
      flattenedhit: flattened,
      applyAll_chkd: false,
      applyAll_dsbl: true,
      cbtxt_applyAll: 'Check to Apply to ALL Occurrences',
      isModalVisible: false,
      tagInValid: true,
      selectedField: '_id',
      options: [],
      selectedoptions: [],
      closenav: 'closed',
    };

    console.log('this.state.flattenedhit');
    console.log(this.state.flattenedhit);
  }

  setTags = (t: AnalystTag[]) => this.setState({ tags: t });
  setPendingTags = (t: AnalystTag[]) => this.setState({ pendingTags: t });
  setOptions = (s: EuiComboBoxOptionOption[]) => this.setState({ options: s });
  setTextVal = (s: EuiComboBoxOptionOption[]) => this.setState({ selectedoptions: s });
  set_txt_applyAll = (s: string) => this.setState({ cbtxt_applyAll: s });
  setChecked_applyAll = (b: boolean) => this.setState({ applyAll_chkd: b });
  setDisabled_applyAll = (b: boolean) => this.setState({ applyAll_dsbl: b });
  settagInValid = (b: boolean) => this.setState({ tagInValid: b });
  setSelectedField = (s: string) => this.setState({ selectedField: s });

  closeModal = () => this.setState({ isModalVisible: false });
  showModal = () => this.setState({ isModalVisible: true });

  toggleNavGroup = () =>
    this.setState({ closenav: this.state.closenav == 'closed' ? 'open' : 'closed' });

  //This is an incredibly cumbersome way of dealing with EUI components not having a freaking wrapper property. ie adding a zero space UTF-8 character
  addStringWraping(s: string) {
    var stringBuilder = '';

    for (let i = 0; i < s.length; i++) {
      stringBuilder = stringBuilder + s[i] + '\u200B';
    }

    return stringBuilder;
  }

  getField(value: string) {
    var tempTags = this.state.tags;
    var temp = { name: value }; //kept an older format in case I need to revert where temp was class IndexPatternField
    if (temp != null) {
      // console.log('this.props.flattened');
      // console.log(this.props.flattened);

      var fValue = ValToString(
        this.props.flattened ? this.props.flattened[temp.name] : this.state.flattenedhit![temp.name]
      );
      // console.log('field Value' + fValue);
      if (fValue === 'undefined') {
        fValue = '(empty)';
      }

      this.setSelectedField(value);
      if (temp.name != '_id') {
        // console.log('Wrapping Data String');
        var output = this.addStringWraping(
          'Check to Apply to ALL Occurrences of (  ' + temp.name + ': ' + fValue + '  )'
        );
        this.set_txt_applyAll(output);
        this.setDisabled_applyAll(false);
        for (let tag in tempTags) {
          tempTags[tag].fieldname = temp.name;
          tempTags[tag].fieldval = fValue;
        }
        this.setTags(tempTags);
      } else {
        for (let tag in tempTags) {
          tempTags[tag].fieldname = '_id';
          tempTags[tag].fieldval = this.props.flattened
            ? this.props.flattened['_id']
            : this.state.flattenedhit!['_id'];
        }
        this.setTags(tempTags);
        this.set_txt_applyAll(
          'Check to Apply to ALL Occurrences -- There is only one occurence of _id as it is a unique id'
        );
      }
    } else {
      for (let tag in tempTags) {
        tempTags[tag].fieldname = '_id';
        tempTags[tag].fieldval = this.props.flattened
          ? this.props.flattened['_id']
          : this.state.flattenedhit!['_id'];
      }
      this.setTags(tempTags);
      this.set_txt_applyAll('Check to Apply to ALL Occurrences');
      this.setDisabled_applyAll(true);
    }
  }

  onCreateOption(
    searchValue: string,
    flattenedOptions: EuiComboBoxOptionOption[] = [],
    ATTab: AddTag
  ) {
    const normalizedSearchValue = searchValue.trim().toLowerCase();

    if (!normalizedSearchValue) {
      return;
    }

    const newOption = {
      label: searchValue,
    };

    // Create the option if it doesn't exist.
    if (
      flattenedOptions.findIndex(
        (option) => option.label.trim().toLowerCase() === normalizedSearchValue
      ) === -1
    ) {
      var options = ATTab.state.options;
      ATTab.setOptions([...options, newOption]);
    }

    // Select the option.
    var selectedOptions = ATTab.state.selectedoptions;
    selectedOptions.push(newOption);
    ATTab.checkTags(selectedOptions);
  }

  checkTags = (value: EuiComboBoxOptionOption[]) => {
    // console.log('inside check1');
    // this.displayTagsSelectedFeild('in CHECK ');
    //console.log('checking tags');
    //console.log('selected field ' + this.state.selectedField);

    this.setTextVal(value);
    var tempTags: AnalystTag[] = [];
    for (let tag in value) {
      var prototag = CopyObject(this.state.prototag);
      prototag.tag = value[tag].label.trim();
      tempTags.push(prototag);
    }
    this.setTags(tempTags);
    if (value.length == 0) {
      this.settagInValid(true);
    } else {
      //check for duplicate tags
      this.settagInValid(false);
    }
    // console.log('inside check 2');
    console.log(tempTags);
    tempTags.forEach((tagToAdd) => {
      // console.log('inside check3');
      console.log(this.props.currentTags);

      if (this.props.currentTags.length == 0) {
        if (tagToAdd.tag.includes('\u200b') || tagToAdd.tag.length > 32) {
          // console.log('inside check');
          this.settagInValid(true);
          return;
        }
      } else {
        this.props.currentTags.forEach((currentTag) => {
          //console.log(tagToAdd.tag.toLowerCase() + " vs " + currentTag.tag.toLowerCase());
          // console.log('before check current tag name:' + tagToAdd.tag);
          if (
            tagToAdd.tag.toLowerCase() == currentTag.tag.toLowerCase() ||
            tagToAdd.tag.includes('\u200b') ||
            tagToAdd.tag.length > 32
          ) {
            // console.log('inside check');
            this.settagInValid(true);
            return;
          }
        });
      }
    });
    // this.displayTagsSelectedFeild('in AFTER CHECK ');
  };

  onSubmit() {
    this.getField(this.state.selectedField);
    const core = getCore();
    var tempTags = CopyObject(this.state.tags);
    if (!this.state.tagInValid) {
      core.http
        .get('/api/spitting_alpaca/getuser')
        .then((res: { time: string; username: string }) => {
          for (let tag in tempTags) {
            tempTags[tag].fieldname = this.state.selectedField;
            tempTags[tag].username = res.username;
            tempTags[tag].timestamp = res.time.replace('GMT', 'Zulu');
            if (this.state.applyAll_chkd) {
              tempTags[tag].applytoall = true;
            }
          }
          this.setPendingTags(tempTags);
        });
      this.showModal();
    }
  }

  onConfirm(ATTab: AddTag) {
    const core = getCore();

    // console.log(ATTab.state.pendingTags);
    var pendingTags = ATTab.state.pendingTags as AnalystTag[];
    for (let tag in pendingTags) {
      // console.log('ANALYST NOTE TAG: ' + pendingTags[tag].tag);
      // if (pendingTags[tag].tag.length > 32) {
      //   console.log('Tag is too long');
      //   core.notifications.toasts.addDanger(
      //     {
      //       title: (e) => {
      //         ReactDOM.render(
      //           <EuiText>
      //             Failed to add Tag due to length({pendingTags[tag].tag.length}/32 characters)
      //             <EuiBadge color="primary">{pendingTags[tag].tag}</EuiBadge>
      //           </EuiText>,
      //           e
      //         );
      //         return () => ReactDOM.unmountComponentAtNode(e);
      //       },
      //     },
      //     { toastLifeTimeMs: 3000 }
      //   );
      //   break;
      // }

      core.http
        .put('/api/spitting_alpaca/addtag', { body: JSON.stringify(pendingTags[tag]) })
        .then((res) => {
          console.log(res);
          if (res.status.statusCode == 200) {
            core.notifications.toasts.addSuccess(
              {
                title: (e) => {
                  ReactDOM.render(
                    <Fragment>
                      <p>
                        Tag:
                        {this.addStringWraping(pendingTags[tag].tag)}
                      </p>
                      <p>Added Successfully</p>
                    </Fragment>,
                    e
                  );
                  //once the tag has been added successfully add the tag to the props so the user cant submit the tag again(this gets checked in the checktags function)
                  pendingTags.forEach((tagBeingAdded) => {
                    this.props.currentTags.push(tagBeingAdded);
                  });
                  if (this.props.refreshDashboardTags != null) {
                    this.props.refreshDashboardTags();
                  }
                  return () => ReactDOM.unmountComponentAtNode(e);
                },
              },
              { toastLifeTimeMs: 3000 }
            );
            if (ATTab.props.tags[0].username == 'Moon Dragon') {
              ATTab.props.setTags([formatTag(pendingTags[tag])]);
            } else {
              var tempTags = ATTab.props.tags;
              tempTags.push(formatTag(pendingTags[tag]));
              console.log(tempTags);
              ATTab.props.setTags(tempTags);
            }
            ATTab.setTextVal([]);
            ATTab.closeModal();
            ATTab.toggleNavGroup();
          } else {
            core.notifications.toasts.addDanger(
              {
                title: (e) => {
                  ReactDOM.render(
                    <EuiText>
                      Failed to add Tag<EuiBadge color="primary">{pendingTags[tag].tag}</EuiBadge>
                    </EuiText>,
                    e
                  );
                  return () => ReactDOM.unmountComponentAtNode(e);
                },
              },
              { toastLifeTimeMs: 3000 }
            );
          }
        })
        .catch((err) => {
          console.log(err);
          core.notifications.toasts.addDanger(
            {
              title: (e) => {
                ReactDOM.render(
                  <EuiText>
                    Failed to add Tag<EuiBadge color="primary">{pendingTags[tag].tag}</EuiBadge>
                  </EuiText>,
                  e
                );
                return () => ReactDOM.unmountComponentAtNode(e);
              },
            },
            { toastLifeTimeMs: 3000 }
          );
        });
    }
  }

  addStringWrappingToTag(tag: AnalystTag) {
    let newTag: AnalystTag = {
      username: tag.username,
      rawtime: tag.rawtime,
      timestamp: tag.timestamp,
      originalIndex: tag.originalIndex,
      originalId: tag.originalId,
      fieldname: tag.fieldname,
      fieldval: this.addStringWraping(tag.fieldval),
      tag: this.addStringWraping(tag.tag),
      applytoall: tag.applytoall,
    };

    return newTag;
  }

  displayTagsSelectedFeild(message?: string) {
    this.props.currentTags.forEach((tag) => {
      //console.log("tag " + tag.tag);

      this.state.tags.forEach((tag) => {
        console.log(message + tag.fieldname);
      });

      /*
display the all the tags selected field before during and after a checktag onchange callStack. we can see 
what is changing and if it is really a set state call messing with this. Also the selected state is 
still saved on the webpage so maybe just grab it again when we enter the format tag call 
*/
    });
  }

  render() {
    //console.log('rerender');
    //this.displayTagsSelectedFeild('in render1 ');

    let modal: JSX.Element;

    var forcedclose = this.state.closenav;

    //console.log(this.state.flattenedhit);
    if (this.state.isModalVisible && this.state.pendingTags) {
      // if this is true the modal is create and loaded in
      var tempcomments: EuiCommentProps[] = [];
      for (let tag in this.state.pendingTags) {
        tempcomments.push(formatTag(this.addStringWrappingToTag(this.state.pendingTags[tag])));
      }

      modal = (
        <EuiOverlayMask>
          <EuiConfirmModal
            title="Please Confirm Your Tag"
            onCancel={this.closeModal}
            onConfirm={() => this.onConfirm(this)}
            cancelButtonText="I need to change it"
            confirmButtonText="Looks Good"
            defaultFocusedButton="confirm"
          >
            <EuiCommentList comments={tempcomments} />
            <p>Does your tag look correct?</p>
          </EuiConfirmModal>
        </EuiOverlayMask>
      );
      // this.displayTagsSelectedFeild('after modal ');
    }
    return (
      <EuiForm>
        {modal!}
        <EuiSpacer size="l" />
        <EuiCollapsibleNavGroup
          title={
            <span>
              <EuiSpacer size="l"></EuiSpacer>
              <strong>Add a New Data Tag</strong>
            </span>
          }
          forceState={forcedclose}
          onToggle={() => this.toggleNavGroup()}
          iconType="editorComment"
          iconSize="xl"
          isCollapsible={true}
          initialIsOpen={false}
          background="none"
        >
          <EuiSpacer size="l" />

          <EuiFormRow
            label={
              <EuiToolTip content="Select The field you want to relate this Tag too. Defaults to _id.">
                <span>
                  <EuiText>
                    <p>
                      <EuiIcon type="questionInCircle" color="subdued" />
                      Field to reference:
                    </p>
                  </EuiText>
                </span>
              </EuiToolTip>
            }
          >
            <EuiSuperSelect
              options={FlattenedHitsToDisplayOptions(
                FilterFlattened(
                  this.props.flattened ? this.props.flattened : this.state.flattenedhit!
                )
              )}
              valueOfSelected={this.state.selectedField}
              onChange={(value) => {
                this.getField(value);
              }}
            />
          </EuiFormRow>

          <EuiSpacer size="l" />
          <EuiCheckbox
            id={htmlIdGenerator()()}
            label={this.state.cbtxt_applyAll}
            disabled={this.state.applyAll_dsbl}
            checked={this.state.applyAll_chkd}
            onChange={(e) => this.setChecked_applyAll(e.target.checked)}
          />
          <EuiSpacer size="l" />

          <EuiFormRow
            error={['*Tag Message is Required. **Tag Message must be 32 characters or less']}
            isInvalid={this.state.tagInValid}
            label={
              <EuiText>
                <p>Tag Message:</p>
              </EuiText>
            }
            fullWidth
          >
            <EuiComboBox
              placeholder="Add Your New Tag Here"
              isInvalid={this.state.tagInValid}
              options={this.state.options}
              selectedOptions={this.state.selectedoptions}
              onChange={this.checkTags}
              onCreateOption={(s, f) => this.onCreateOption(s, f, this)}
              isClearable={true}
            />
          </EuiFormRow>

          <EuiButton onClick={() => this.onSubmit()}>Submit</EuiButton>
        </EuiCollapsibleNavGroup>
      </EuiForm>
    );
  }
}
