import {DataLoader, NotificationType, Page, SlidingPanel} from 'argo-ui';
import {AppContext} from 'argo-ui/src/index';
import * as classNames from 'classnames';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import {RouteComponentProps} from 'react-router';
import * as models from '../../../../models';
import {uiUrl} from '../../../shared/base';
import {services} from '../../../shared/services';
import {
    WorkflowArtifacts,
    WorkflowDag,
    WorkflowLogsViewer,
    WorkflowNodeInfo,
    WorkflowParametersPanel,
    WorkflowSummaryPanel,
    WorkflowTimeline,
    WorkflowYamlViewer
} from '../../../workflows/components';

require('../../../workflows/components/workflow-details/workflow-details.scss');

export class WorkflowHistoryDetails extends React.Component<RouteComponentProps<any>, any> {
    public static contextTypes = {
        router: PropTypes.object,
        apis: PropTypes.object
    };

    private get namespace() {
        return this.props.match.params.namespace;
    }

    private get uid() {
        return this.props.match.params.uid;
    }

    private get tab() {
        return this.getParam('tab') || 'workflow';
    }

    private set tab(tab) {
        this.setParams({tab});
    }

    private get nodeId() {
        return this.getParam('nodeId');
    }

    private set nodeId(nodeId) {
        this.setParams({nodeId});
    }

    private get container() {
        return this.getParam('container') || 'main';
    }

    private get sidePanel() {
        return this.getParam('sidePanel');
    }

    private set sidePanel(sidePanel) {
        this.setParams({sidePanel});
    }

    public render() {
        return (
            <Page
                title='Workflow History Details'
                toolbar={{
                    actionMenu: {
                        items: [
                            {
                                title: 'Resubmit',
                                iconClassName: 'fa fa-redo',
                                action: () => this.resubmitWorkflowHistory()
                            },
                            {
                                title: 'Delete',
                                iconClassName: 'fa fa-trash',
                                action: () => this.deleteWorkflowHistory()
                            }
                        ]
                    },
                    breadcrumbs: [
                        {
                            title: 'Workflow History',
                            path: uiUrl('workflow-history')
                        },
                        {title: this.namespace + '/' + this.uid}
                    ],
                    tools: (
                        <div className='workflow-details__topbar-buttons'>
                            <a className={classNames({actve: this.tab === 'summary'})} onClick={() => (this.tab = 'summary')}>
                                <i className='fa fa-columns' />
                            </a>
                            <a className={classNames({active: this.tab === 'timeline'})} onClick={() => (this.tab = 'timeline')}>
                                <i className='fa argo-icon-timeline' />
                            </a>
                            <a className={classNames({active: this.tab === 'workflow'})} onClick={() => (this.tab = 'workflow')}>
                                <i className='fa argo-icon-workflow' />
                            </a>
                        </div>
                    )
                }}>
                <div className={classNames('workflow-details', {'workflow-details--step-node-expanded': !!this.nodeId})}>
                    <DataLoader load={() => services.workflowHistory.get(this.namespace, this.uid)}>
                        {wf => (
                            <React.Fragment>
                                {this.tab === 'summary' ? (
                                    <div className='argo-container'>
                                        <div className='workflow-details__content'>
                                            <WorkflowSummaryPanel workflow={wf} />
                                            {wf.spec.arguments && wf.spec.arguments.parameters && (
                                                <React.Fragment>
                                                    <h6>Parameters</h6>
                                                    <WorkflowParametersPanel parameters={wf.spec.arguments.parameters} />
                                                </React.Fragment>
                                            )}
                                            <h6>Artifacts</h6>
                                            <WorkflowArtifacts workflow={wf} />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className='workflow-details__graph-container'>
                                            {this.tab === 'workflow' ? (
                                                <WorkflowDag workflow={wf} selectedNodeId={this.nodeId} nodeClicked={node => (this.nodeId = node.id)} />
                                            ) : (
                                                <WorkflowTimeline workflow={wf} selectedNodeId={this.nodeId} nodeClicked={node => (this.nodeId = node.id)} />
                                            )}
                                        </div>
                                        {this.nodeId && (
                                            <div className='workflow-details__step-info'>
                                                <button className='workflow-details__step-info-close' onClick={() => (this.nodeId = null)}>
                                                    <i className='argo-icon-close' />
                                                </button>
                                                <WorkflowNodeInfo
                                                    node={this.node(wf)}
                                                    workflow={wf}
                                                    onShowYaml={nodeId =>
                                                        this.setParams({
                                                            sidePanel: 'yaml',
                                                            nodeId
                                                        })
                                                    }
                                                    onShowContainerLogs={(nodeId, container) =>
                                                        this.setParams({
                                                            sidePanel: 'logs',
                                                            nodeId,
                                                            container
                                                        })
                                                    }
                                                    artifactsMessage={
                                                        <p>
                                                            <i className='fa fa-exclamation-triangle' /> Artifacts for historical workflows maybe be overwritten by a more recent
                                                            workflow with the same name.
                                                        </p>
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                                <SlidingPanel isShown={!!this.sidePanel} onClose={() => (this.sidePanel = null)}>
                                    {this.sidePanel === 'yaml' && <WorkflowYamlViewer workflow={wf} selectedNode={this.node(wf)} />}
                                    {this.sidePanel === 'logs' && (
                                        <WorkflowLogsViewer
                                            workflow={wf}
                                            nodeId={this.nodeId}
                                            container={this.container}
                                            message={
                                                <p>
                                                    <i className='fa fa-exclamation-triangle' /> Logs for historical workflows maybe overwritten by more recent workflow with the
                                                    same name.
                                                </p>
                                            }
                                        />
                                    )}
                                </SlidingPanel>
                            </React.Fragment>
                        )}
                    </DataLoader>
                </div>
            </Page>
        );
    }

    private getParam(name: string) {
        return new URLSearchParams(this.appContext.router.route.location.search).get(name);
    }

    // this allows us to set-multiple parameters at once
    private setParams(newParams: any) {
        const params = new URLSearchParams(this.appContext.router.route.location.search);
        Object.keys(newParams).forEach(name => {
            const value = newParams[name];
            if (value !== null) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
        });
        this.appContext.router.history.push(`${this.props.match.url}?${params.toString()}`);
    }

    private node(wf: models.Workflow) {
        return this.nodeId && wf.status.nodes[this.nodeId];
    }

    private resubmitWorkflowHistory() {
        if (!confirm('Are you sure you want to re-submit this workflow history?')) {
            return;
        }
        services.workflowHistory
            .resubmit(this.namespace, this.uid)
            .catch(e => {
                this.appContext.apis.notifications.show({
                    content: 'Failed to resubmit workflow history ' + e,
                    type: NotificationType.Error
                });
            })
            .then((wf: models.Workflow) => {
                document.location.href = `/workflows/${wf.metadata.namespace}/${wf.metadata.name}`;
            });
    }

    private deleteWorkflowHistory() {
        if (!confirm('Are you sure you want to delete this workflow history?\nThere is no undo.')) {
            return;
        }
        services.workflowHistory
            .delete(this.namespace, this.uid)
            .catch(e => {
                this.appContext.apis.notifications.show({
                    content: 'Failed to delete workflow history ' + e,
                    type: NotificationType.Error
                });
            })
            .then(() => {
                document.location.href = '/workflow-history';
            });
    }

    private get appContext(): AppContext {
        return this.context as AppContext;
    }
}
