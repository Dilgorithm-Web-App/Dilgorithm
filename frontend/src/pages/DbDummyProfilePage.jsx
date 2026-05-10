export const DbDummyProfilePage = () => {
    const userId = localStorage.getItem('db_user_id');

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'grid',
                placeItems: 'center',
                padding: '24px',
                boxSizing: 'border-box',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '640px',
                    background: '#fffdfd',
                    border: '1px solid #f1e6eb',
                    borderRadius: '14px',
                    padding: '24px',
                }}
            >
                <h2 style={{ marginTop: 0 }}>Dummy User Profile</h2>
                <p style={{ marginBottom: '8px' }}>
                    Login/signup is successful and integrated with SQL stored procedures.
                </p>
                <p style={{ marginBottom: '0' }}>
                    <strong>User ID:</strong> {userId || 'N/A'}
                </p>
            </div>
        </div>
    );
};
