import {DataLoader, MockupList, Page} from 'argo-ui';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import {Link, RouteComponentProps} from 'react-router-dom';
import * as models from '../../../../models';
import {uiUrl} from '../../../shared/base';
import {services} from '../../../shared/services';
import {WorkflowListItem} from '../../../workflows/components';

export class WorkflowHistoryList extends React.Component<RouteComponentProps<any>> {
    public static contextTypes = {
        router: PropTypes.object,
        apis: PropTypes.object
    };

    public render() {
        return (
            <Page
                title='Workflow History'
                toolbar={{
                    breadcrumbs: [{title: 'Workflow History', path: uiUrl('workflow-history')}]
                }}>
                <div className='workflow-history-list'>
                    <DataLoader load={() => services.workflowHistory.list()} loadingRenderer={() => <MockupList height={150} marginTop={30} />}>
                        {(workflows: models.Workflow[]) => (
                            <div className='row'>
                                <div className='columns small-12 xxlarge-2'>
                                    {workflows.length === 0 && (
                                        <div className='white-box'>
                                            <h4>No workflow history</h4>
                                            <p>To record history you must enabled history in configuration.</p>
                                        </div>
                                    )}
                                    <p>
                                        <i className='fa fa-info-circle' /> Workflow history entries are created when a workflow completes.
                                    </p>
                                    {workflows.map(workflow => (
                                        <div key={workflow.metadata.uid}>
                                            <Link to={uiUrl(`workflow-history/${workflow.metadata.namespace}/${workflow.metadata.uid}`)}>
                                                <WorkflowListItem workflow={workflow} history={true} />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </DataLoader>
                </div>
            </Page>
        );
    }
}
